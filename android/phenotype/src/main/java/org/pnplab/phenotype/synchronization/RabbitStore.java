package org.pnplab.phenotype.synchronization;

import com.rabbitmq.client.Channel;

import java.io.IOException;
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

import io.reactivex.rxjava3.core.Observable;
import java9.util.Optional;
import java9.util.stream.Collectors;
import java9.util.stream.Stream;
import java9.util.stream.StreamSupport;

// @warning not thread safe.
public class RabbitStore extends Store {

    private final String _tableName;
    private final Channel _channel;
    private final List<Field> _classFields;

    // Buffer have dynamic length if it contains string (which have dynamic
    // length depending on the data).
    private final boolean _isBufferDynamicLength;

    // @todo @warning _buffer is not thread safe! @todo fix or validate
    // will be null if buffer has dynamic length. -- always big endian by default.
    private ByteBuffer _buffer;

    // @warning
    // AMQP recommended max size for messages in RabbitMQ 3.8+
    // - is 128MiB according to CloudAMQP + code ref.
    //   cf. https://www.cloudamqp.com/blog/2019-05-24-what-is-the-message-size-limit-in-rabbitmq.html
    // - is 512MiB according to stackoverflow + code ref.
    //   cf. https://stackoverflow.com/questions/18353898/rabbitmq-message-size-and-types
    // Thus we thrushold limit to 100MiB.
    //
    // @warning
    // While working, it's recommended to fragment messages into smaller
    // messages upfront though.
    // cf. https://groups.google.com/forum/#!topic/rabbitmq-discuss/ZYsqJt422cQ.
    // Note the above linked group discussion is a bit old and I am not
    // personnally convinced about these buffer issues since TPC/UDP should
    // already segment messages and RabbitMQ seems to handle message RAM quite
    // well.
    // cf. https://www.rabbitmq.com/lazy-queues.html
    // Better be safe than sorry though and reduced response latency is still
    // important.
    public final static int MAX_BUFFER_SIZE = 104857600; // in byte

    public RabbitStore(Channel channel, String tableName, Class<?> dataClass, String... orderedFieldNames_) {
        super();

        // Need to declare queue first in rabbitmq before being able to write
        // to it!
        // @todo QUEUE OUT OF THIS CONSTRUCTOR CODE clean this code!
        //  unsafe + will break app if not handled (queue redeclared).
        //  cf. https://www.oracle.com/technetwork/java/seccodeguide-139067.html#7
        try {
            channel.queueDeclare(tableName, true, false, false, null);
        }
        catch (IOException e) {
            throw new RuntimeException(e);
        }

        // @note sole advantage of declaring class and tablename here is for caching.
        this._channel = channel;
        this._tableName = tableName;

        // Setup data class field names and order.
        //
        // @warning
        // These should map class constructor parameters, in order.
        //
        // @note
        // Although it is possible to retrieve constructor arguments order, It
        // is impossible to
        // - retrieve field order from class reflection.
        // - retrieve constructor argument names.
        // Thus it is mandatory for user to specify them, as reflection is not
        // enough.
        //
        // 1. Convert ordered field names to list.
        List<String> orderedFieldNames = Arrays.asList(orderedFieldNames_);
        // 2. Retrieve ordered Field instances from ordered field names and
        // class.
        this._classFields = this._getClassFields(orderedFieldNames, dataClass);
        // 3. Check class fields are found and public.
        int expectedFieldCount = orderedFieldNames.size();
        boolean areInputFieldsCompatibleWithClass = StreamSupport
                .stream(this._classFields)
                .map(Field::getName)
                .filter(orderedFieldNames::contains)
                .count() == expectedFieldCount;
        // 4. Throw exception if not.
        // @todo move exception out of constructor (partially constructed class seems unsafe).
        if (!areInputFieldsCompatibleWithClass) {
            throw new IllegalArgumentException("Input field names are not compatible with input class type.");
        }

        // Pre-generate buffer if size is predetermined (this depends on data
        // type, ie. String is not).
        // @todo @warning _buffer is not thread safe!
        // @notes Still a good idea to keep in mind as it remove memory alloc / disalloc op out of the writing loop.

        boolean isBufferDynamicLength;
        try {
            isBufferDynamicLength = false;
            this._buffer = this._generateStaticLengthBuffer(this._classFields);
        }
        catch (IllegalArgumentException exc) {
            isBufferDynamicLength = true;
            this._buffer = null;
        }
        this._isBufferDynamicLength = isBufferDynamicLength;

    }

    private List<Field> _getClassFields(List<String> orderedFieldNames, Class<?> dataClass) {
        List<Field> dataFields = Stream
                .of(dataClass.getDeclaredFields())
                // Ignore fields that aren't set in the given field order list
                // and ignore non-public fields.
                .filter(field -> orderedFieldNames.contains(field.getName()) && Modifier.isPublic(field.getModifiers()))
                // Sort the fields by their manually provided order.
                // @warning field must be in both array !
                // @todo check arg - recast exception with clear message.
                .sorted((a, b) -> orderedFieldNames.indexOf(a.getName()) - orderedFieldNames.indexOf(b.getName()))
                // Return the fields as list
                .collect(Collectors.toList());

        return dataFields;
    }

    private int _retrieveBufferSizeFromStaticLengthType(String canonicalTypeName) {
        // Return the protocol byte number for the data type (includes wrapper
        // types and primitive ones).
        switch (canonicalTypeName) {
            case "boolean":
            case "java.lang.Boolean":
                return 16; // ByteBuffer#putChar is 2 bytes value.
            case "int":
            case "java.lang.Integer":
                return 32;
            case "long":
            case "java.lang.Long":
                return 64;
            case "float":
            case "java.lang.Float":
                return 32;
            case "double":
            case "java.lang.Double":
                return 64;
            case "java.lang.String":
                // String values are comprised of a 32bit unsigned int and
                // a variable length UTF8 byte string. Thus, the buffer
                // size is dependent of the specific underlying recorded
                // data. As such, the data type is not enough to define the
                // buffer size.
                throw new IllegalArgumentException("Unsupported variable length type: String");
                // break;
            default:
                throw new IllegalArgumentException("Unsupported value type: " + canonicalTypeName);
        }
    }

    private int _retrieveBufferSizeFromDynamicLengthType(String canonicalTypeName, CharSequence sequence) {
        // Return the protocol byte number for the data type (includes wrapper
        // types and primitive ones).
        switch (canonicalTypeName) {
            case "java.lang.String":
                // String values are comprised of a 32bit unsigned int and
                // a variable length UTF8 byte string. Thus, the buffer
                // size is dependent of the specific underlying recorded
                // data. As such, the data type is not enough to define the
                // buffer size.
                int count = 32;

                // Calculate the string binary length from the utf-8 sequence.
                // cf. https://stackoverflow.com/questions/8511490/calculating-length-in-utf-8-of-java-string-without-actually-encoding-it
                for (int i = 0, len = sequence.length(); i < len; i++) {
                  char ch = sequence.charAt(i);
                  if (ch <= 0x7F) {
                    count++;
                  } else if (ch <= 0x7FF) {
                    count += 2;
                  } else if (Character.isHighSurrogate(ch)) {
                    count += 4;
                    ++i;
                  } else {
                    count += 3;
                  }
                }

                // Return the value.
                return count;
            case "boolean":
            case "java.lang.Boolean":
            case "int":
            case "java.lang.Integer":
            case "long":
            case "java.lang.Long":
            case "float":
            case "java.lang.Float":
            case "double":
            case "java.lang.Double":
                throw new IllegalArgumentException("Expected variable length type instead of " + canonicalTypeName);
            default:
                throw new IllegalArgumentException("Unsupported value type: " + canonicalTypeName);
        }
    }

    private ByteBuffer _generateStaticLengthBuffer(List<Field> classFields) {
        int bufferSize = 0;

        for (Field field : classFields) {
            // Retrieve type canonical name.
            Class<?> type = field.getType();
            String typeName = type.getCanonicalName();

            // Retrieve type simple name if type has no canonical name (this is
            // not expected to happens though).
            if (typeName == null) {
                typeName = type.getSimpleName();
            }

            // Return field content byte size.
            switch (typeName) {
                case "java.lang.String":
                    // String values are comprised of a 32bit unsigned int and
                    // a variable length UTF8 byte string. Thus, the buffer
                    // size is dependent of the specific underlying recorded
                    // data. As such, the data type is not enough to define the
                    // buffer size.
                    throw new IllegalArgumentException("Unsupported variable length type: String");
                case "boolean":
                case "java.lang.Boolean":
                case "int":
                case "java.lang.Integer":
                case "long":
                case "java.lang.Long":
                case "float":
                case "java.lang.Float":
                case "double":
                case "java.lang.Double":
                    bufferSize += _retrieveBufferSizeFromStaticLengthType(typeName);
                    break;
                default:
                    throw new IllegalArgumentException("Unsupported value type: " + typeName);
            }
        }

        // Check buffer limit.
        if (bufferSize > MAX_BUFFER_SIZE) {
            throw new IllegalArgumentException("Buffer size limited to 100MiB but received " + bufferSize + " bytes");
        }

        // Generate buffer.
        ByteBuffer buffer = ByteBuffer.allocate(bufferSize); // Always big endian by default
        return buffer;
    }

    private ByteBuffer _generateDynamicLengthBuffer(List<Field> classFields, Object data) {
        int bufferSize = 0;

        for (Field field : classFields) {
            // Retrieve type canonical name.
            Class<?> type = field.getType();
            String typeName = type.getCanonicalName();

            // Retrieve type simple name if type has no canonical name (this is
            // not expected to happens though).
            if (typeName == null) {
                typeName = type.getSimpleName();
            }

            // Return field content byte size.
            switch (typeName) {
                case "java.lang.String":
                    // String values are comprised of a 32bit unsigned int and
                    // a variable length UTF8 byte string. Thus, the buffer
                    // size is dependent of the specific underlying recorded
                    // data.
                    try {
                        String str = (String) field.get(data);

                        // If string is null, throws an exception.
                        //
                        // @note
                        // We could also put a 0-length value instead, but this
                        // seems more error-prone in the long-term.
                        if (str == null) {
                            throw new IllegalArgumentException("String value is null.");
                        }
                        // If string isn't null, return its UTF-8 byte length.
                        else {
                            bufferSize += _retrieveBufferSizeFromDynamicLengthType("java.lang.String", str);
                        }
                        break;
                    }
                    // Rethrow illegal access checked exception as unchecked
                    // ones. Unlikely to happen as the fields should already
                    // have been checked for public access only outside of this
                    // method.
                    catch (IllegalAccessException exc) {
                        throw new RuntimeException(exc);
                    }

                case "boolean":
                case "java.lang.Boolean":
                case "int":
                case "java.lang.Integer":
                case "long":
                case "java.lang.Long":
                case "float":
                case "java.lang.Float":
                case "double":
                case "java.lang.Double":
                    bufferSize += _retrieveBufferSizeFromStaticLengthType(typeName);
                    break;
                default:
                    throw new IllegalStateException("Unsupported value type: " + typeName);
            }
        }

        // Check buffer limit.
        if (bufferSize > MAX_BUFFER_SIZE) {
            throw new IllegalArgumentException("Buffer size limited to 100MiB but received " + bufferSize + " bytes");
        }

        // Generate buffer.
        ByteBuffer buffer = ByteBuffer.allocate(bufferSize); // @note always big endian by default.
        return buffer;
    }

    @Override
    public void write(Object data) {
        ByteBuffer buffer;

        // Use pre-allocated buffer if it has already been generated (because
        // it has a static, predicted size).
        //
        // @note
        // Both ways of generating buffer checks for the buffer to be < 100 MiB
        // (protocol requirement).
        //
        // @note
        // Buffers are big endian by default (due to JAVA API).
        if (!_isBufferDynamicLength) {
            // Take pre-allocated buffer.
            buffer = _buffer;

            // Reset the buffer ptr (possibly incremented from previous write
            // iteration).
            buffer.clear();
        }
        // Reallocate the buffer it if its size can not be known without the
        // data.
        //
        // @note
        // Buffer allocation and buffer filling must be separated by design (
        // memory allocation is an independent op).
        else {
            buffer = _generateDynamicLengthBuffer(this._classFields, data);
        }

        // Fill the buffer.
        for (Field field : this._classFields) {
            // Retrieve type canonical name.
            Class<?> type = field.getType();
            String typeName = type.getCanonicalName();

            // Retrieve type simple name if type has no canonical name (this is
            // not expected to happens though).
            if (typeName == null) {
                typeName = type.getSimpleName();
            }

            try {
                switch (typeName) {
                    case "boolean":
                    case "java.lang.Boolean":
                        boolean valueIsTrue = field.getBoolean(data);
                        buffer.putChar(valueIsTrue ? 't' : 'f');
                        break;
                    case "int":
                    case "java.lang.Integer":
                        buffer.putInt(field.getInt(data));
                        break;
                    case "long":
                    case "java.lang.Long":
                        buffer.putLong(field.getLong(data));
                        break;
                    case "float":
                    case "java.lang.Float":
                        buffer.putFloat(field.getFloat(data));
                        break;
                    case "double":
                    case "java.lang.Double":
                        buffer.putDouble(field.getDouble(data));
                        break;
                    case "java.lang.String":
                        String str = (String) field.get(data);

                        // If string is null, throws an exception.
                        //
                        // @note
                        // We could also put a 0-length value instead, but this
                        // seems more error-prone in the long-term.
                        //
                        // @warning
                        // In our use-case, method user should catch and log
                        // this exception in the stream handler in order to
                        // avoid stopping the whole stream in case of a single
                        // error.
                        if (str == null) {
                            throw new IllegalArgumentException("String value is null.");
                        }
                        // If string isn't null, write its size then its
                        // content as UTF-8.
                        else {
                            byte[] bytes = str.getBytes(StandardCharsets.UTF_8);

                            // @note
                            // Java String type already as max length of
                            // 2^31 - 1 so no need to check length for protocol
                            // overflow.
                            // ~= 2Go

                            // Put string byte length as 32bit first.
                            buffer.putInt(bytes.length);
                            // Put string UTF-8 bytes.
                            buffer.put(bytes);
                        }
                        break;
                    default:
                        throw new IllegalStateException("Unexpected value: " + typeName);
                }
            }
            // Rethrow illegal access checked exception as unchecked
            // ones. Unlikely to happen as the fields should already
            // have been checked for public access only outside of this
            // method.
            catch (IllegalAccessException exc) {
                throw new RuntimeException(exc);
            }
        }

        // Send message to server.
        try {
            _channel.basicPublish("", this._tableName, null, buffer.array());
        }
        // Convert checked exception to unchecked exception in order to follow
        // the polymorphic method signature.
        catch (IOException exc) {
            throw new RuntimeException(exc);
        }
    }

    // @note custom field writing is required despite possibility to infer them
    //  from class and object reflections as the field order is not garanteed
    //  (and has been tested to change). Thus considering the requirement for a
    //  consistent transmission protocol, it's an implementation choice between
    //  - implementing automatic protocol from java reflection through flexible
    //     field position, which implies field declaration within the protocol
    //     (eg. protocol header). This uses more bandwidth although this can be
    //     mitigated by sending a single header for many package.
    //  - specifying relevant protocol implementation details manually. This is
    //     the simplest solution for now.
    // @note protocol versioning will be a requirement. That can be achieved
    //  through protocol header or through protocol channel. user auth will be
    //  a req. as well. to be thought of.
    // ProtocolBuffer, FlatBuffer, and alternatives have been considered. They
    // all include bandwidth overhead (most have been optimized for
    // serialization/deserialization speed first).
    public static Observable<Optional<RabbitStore>> streamStoreAndRetryOnFailure(String tableName, Class<?> dataClass, String... orderedFieldNames) {
        // Try to provide rabbit mq connection, or empty item
        // (to be processed as local storage fallback) in
        // case of failure (as well as delayed broken
        // connection).
        return RabbitConnection
            .streamAndRetryOnFailure()
            // Create rabbitmq (or empty) store out of rabbitmq _channel.
            .map(optionalChannel -> optionalChannel.isPresent() ?
                    Optional.of(new RabbitStore(optionalChannel.get(), tableName, dataClass, orderedFieldNames)) :
                    Optional.<RabbitStore>empty()
            );
    }
}
