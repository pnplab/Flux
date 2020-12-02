package org.pnplab.phenotype.deprec.synchronization.dataflow;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.Arrays;
import java.util.List;

import java9.util.stream.Collectors;
import java9.util.stream.Stream;
import java9.util.stream.StreamSupport;

public final class OrderedClassReflectionHelper<T> {

    private final Class<T> _dataClass;
    private final List<String> _orderedUserFieldNames;
    private final List<Field> _orderedReflectionField;

    public OrderedClassReflectionHelper(Class<T> dataClass, String... fields) {
        // Setup data class field names and order.
        //
        // @warning
        // These must map class constructor parameters, in order.
        //
        // @warning
        // Fields must be public.
        //
        // @note
        // Although it is possible to programmatically retrieve
        // arguments order, It is impossible to
        // - retrieve field order from class reflection.
        // - retrieve constructor argument names.
        // Thus it is mandatory for user to specify them, as reflection is not
        // enough.

        // 1. Convert String[] to List<String> in order to be able to use with
        // Stream processing methods. @warning Arrays#asList creates readOnly
        // list.
        List<String> orderedFieldNames = Arrays.asList(fields);

        // 2. Retrieve ordered field sout of List<String> and dataClass reflection.
        List<Field> orderedClassFields = Stream
                .of(dataClass.getDeclaredFields())
                // Ignore fields that aren't set in the given field order list
                // and ignore non-public fields.
                .filter(field -> orderedFieldNames.contains(field.getName()) && Modifier.isPublic(field.getModifiers()))
                // Sort the fields by their manually provided order.
                // @warning field must be in both array !
                .sorted((a, b) -> orderedFieldNames.indexOf(a.getName()) - orderedFieldNames.indexOf(b.getName()))
                // Return the fields as list
                .collect(Collectors.toList());

        this._dataClass = dataClass;
        this._orderedUserFieldNames = orderedFieldNames;
        this._orderedReflectionField = orderedClassFields;
    }

    public Constructor getConstructor() {
        // Retrieve constructor.
        Constructor<?>[] constructors = (Constructor<?>[]) _dataClass.getConstructors();
        if (constructors.length != 1) {
            throw new IllegalArgumentException(String.format("Data class %s should have exactly one constructor.", _dataClass.getCanonicalName()));
        }
        Constructor<?> dataClassConstructor = constructors[0];

        return dataClassConstructor;
    }

    public List<Field> getFields() {
        return _orderedReflectionField;
    }

    public void validateOrThrow() {
        // 1. Retrieve ordered Field instances from ordered field names and
        // class.
        int expectedFieldCount = _orderedUserFieldNames.size();

        // 2. Check set field name arguments exists as public class' fields.
        boolean areInputFieldsCompatibleWithClass = StreamSupport
                .stream(_orderedReflectionField)
                .map(Field::getName)
                .filter(_orderedUserFieldNames::contains)
                .count() == expectedFieldCount;

        // 3. Throw exception if not.
        // @todo move exception out of constructor (partially constructed class seems unsafe).
        if (!areInputFieldsCompatibleWithClass) {
            throw new IllegalArgumentException(String.format("Input field names are not compatible with input class type %s.", _dataClass.getCanonicalName()));
        }

        // 4. Retrieve class constructor.
        Constructor constructor = this.getConstructor();

        // 5. Retrieve constructor parameters.
        //
        // @note
        // We requires data class to contain a constructor with specified
        // argument order as we use it to instantiate read data.
        List<String> parameterTypesCanonicalNames = StreamSupport
                .stream(Arrays.asList(constructor.getParameterTypes()))
                .map(Class::getCanonicalName)
                .collect(Collectors.toList());

        // 6. Check constructor as at least one attribute (the primary key
        // field). -- same as checking the field count.
        if (parameterTypesCanonicalNames.size() < 1) {
            throw new IllegalArgumentException(String.format("Data class %s should have at least one argument (the primary key).", _dataClass.getCanonicalName()));
        }

        // 7. Check class constructor consider all fields.
        if (parameterTypesCanonicalNames.size() != _orderedReflectionField.size()) {
            throw new IllegalArgumentException(String.format("Data class %s constructor should have as much argument as there is public field in the class.", _dataClass.getCanonicalName()));
        }

        // 8. Check class constructor arguments types map set order.
        for (int i = 0; i < _orderedReflectionField.size(); ++i) {
            String classFieldTypeName = _orderedReflectionField.get(i).getType().getCanonicalName();
            if (classFieldTypeName == null) { // shouldn't happen ?
                classFieldTypeName = _orderedReflectionField.get(i).getType().getSimpleName();
            }
            String constructorParameterTypeName = parameterTypesCanonicalNames.get(i);
            if (!classFieldTypeName.equals(constructorParameterTypeName)) {
                throw new IllegalArgumentException(String.format("Data class %s constructor arguments types don't map WritableStore set order.", _dataClass.getCanonicalName()));
            }
        }

        // 9. Check class constructor is public.
        if (!Modifier.isPublic(constructor.getModifiers())) {
            throw new IllegalArgumentException("Data class constructor should be public.");
        }
    }
}
