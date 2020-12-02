package org.pnplab.phenotype.synchronization.local;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.os.Environment;

import org.pnplab.phenotype.synchronization.dataflow.OrderedReflectionHelper;
import org.pnplab.phenotype.synchronization.dataflow.ReadableStore;
import org.pnplab.phenotype.synchronization.dataflow.WritableStore;

import java.io.File;
import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;

import io.reactivex.rxjava3.core.Observable;
import java9.util.stream.Collectors;
import java9.util.stream.Stream;
import java9.util.stream.StreamSupport;

// Single table SQLite database.
public class SQLiteStore<T> implements WritableStore, ReadableStore<T> {

    private final String _tableName;
    private final String _primaryKey;
    private final List<Field> _classFields;
    private final Class<T> _dataClass;
    private final Constructor<T> _classConstructor;
    private final SQLiteOpenHelper _sqliteDBHelper;
    private SQLiteDatabase _sqliteDb;

    // Constructor set to private to enforce using the #stream method, in order
    // to keep the store/db lifecycle and stream licycles both bound together.
    // This could be changed.
    private SQLiteStore(Context context, String tableName, Class<T> dataClass, String primaryKey, String... otherFields) {
        this._tableName = tableName;
        this._dataClass = dataClass;

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

        // 1. Setup primary key.
        this._primaryKey = primaryKey;

        // 2. Convert ordered field names to list.
        List<String> orderedFieldNames = new ArrayList<>();
        orderedFieldNames.add(primaryKey);
        orderedFieldNames.addAll(Arrays.asList(otherFields));

        OrderedReflectionHelper orderedReflectionHelper = new OrderedReflectionHelper<T>(dataClass, orderedFieldNames.toArray(new String[0]));
        orderedReflectionHelper.validateOrThrow();

        this._classFields = orderedReflectionHelper.getFields();

        // Register class constructor.
        this._classConstructor = orderedReflectionHelper.getConstructor();

        // Setup db.
        this._sqliteDBHelper = this._setupDB(context, primaryKey, this._classFields);
    }

    // @warning
    // We consider SQLite Helper thread-safety goes as far as ensuring onCreate
    // db callback are either synchronous or later call are delayed.
    // According to doc, "Transactions are used to make sure the database is
    // always in a sensible state".
    private SQLiteOpenHelper _setupDB(Context context, String primaryKey, final List<Field> classFields) {
        final String tableName = this._tableName;

        // List class public field, we'll consider them as SQL table columns.
        Stream<Field> dataFields = StreamSupport.stream(classFields);

        // Pick external storage folder if available (as there is more space in
        // external storage then internal).
        //
        // @note
        // #getExternalStorageDirectory is deprecated as API 29 for privacy
        // reason. #getExternalFilesDir is not and is more privacy-friendly,
        // although any app w/ READ_EXTERNAL_STORAGE still can read them!
        // cf. https://developer.android.com/reference/android/os/Environment.html#getExternalStorageDirectory()
        // cf. https://developer.android.com/reference/android/content/Context#getExternalFilesDir(java.lang.String)
        File dbFolder;
        if (Environment.getExternalStorageState().equals(android.os.Environment.MEDIA_MOUNTED) && context.getExternalFilesDir("sqlite") != null) {
            dbFolder = context.getExternalFilesDir("sqlite");
        }
        else {
            dbFolder = new File(context.getFilesDir(), "sqlite");
        }
        if (dbFolder != null && !dbFolder.exists()) {
            dbFolder.mkdirs();
        }
        if (dbFolder == null){
            throw new IllegalStateException(String.format("Couldn't create sqlite folder for table %s.", tableName));
        }
        String sqliteDBPath = String.format("%s/%s.db", dbFolder.getAbsolutePath(), tableName);

        // Setup SQLite database.
        final int databaseVersion = 1;
        SQLiteOpenHelper sqliteOpenHelper = new SQLiteOpenHelper(context, sqliteDBPath, null, databaseVersion) {
            @Override
            public void onCreate(SQLiteDatabase db) {
                // Generate CREATE TABLE sql query.
                String sqlCreateTableQuery = String.format("CREATE TABLE %s ", tableName) + dataFields
                        // Convert class fields to sql row definitions.
                        .map(field -> {
                            String fieldName = field.getName();
                            Class<?> type = field.getType();
                            String typeName = type.getCanonicalName();

                            if (typeName == null) {
                                throw new IllegalStateException(String.format("Couldn't retrieve class canonical name when constructing sqlite db from class for field %s in %s.", fieldName, _tableName));
                            }

                            // Add primary key to the field creation if relevant.
                            String primaryKeyPostfix = "";
                            if (typeName.equals(primaryKey)) {
                                primaryKeyPostfix = " PRIMARY KEY";
                            }

                            switch (typeName) {
                                case "boolean":
                                case "java.lang.Boolean":
                                case "int":
                                case "java.lang.Integer":
                                case "long":
                                case "java.lang.Long":
                                    return String.format("%s INTEGER%s", fieldName, primaryKeyPostfix);
                                case "float":
                                case "double":
                                case "java.lang.Float":
                                case "java.lang.Double":
                                    return String.format("%s REAL%s", fieldName, primaryKeyPostfix);
                                case "java.lang.String":
                                    // @note SQLite varchar is actually a TEXT
                                    // type (length is ignored in sqlite).
                                    return String.format("%s TEXT%s", fieldName, primaryKeyPostfix);
                                default:
                                    throw new IllegalStateException(String.format("Unexpected value type %s for %s in %s", typeName, fieldName, tableName));
                            }
                        })
                        // Merge sql row definitions together.
                        .collect(Collectors.joining(", ", "(", ")"));

                // Create table.
                db.execSQL(sqlCreateTableQuery);
            }

            @Override
            public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
                throw new RuntimeException("Database upgrade not implemented.");
            }

            @Override
            public void onDowngrade(SQLiteDatabase db, int oldVersion, int newVersion) {
                // db.execSQL(String.format("DROP TABLE IF EXISTS %s", dataClassName));
                onUpgrade(db, oldVersion, newVersion);
            }
        };

        return sqliteOpenHelper;
    }

    // @note
    // we put our synchronized block only to ensure correct exception check in
    // case of open/close, althgouh it's technically not required considering
    // sqlite db is thread safe.
    // @todo remove these synchronize overhead (but double check how to first) !
    @Override
    public synchronized void write(Object data) {
        // Check db is started.
        if (this._sqliteDb == null) {
            throw new IllegalStateException(String.format("Closing SQLiteDb in %s although it is not started.", _tableName));
        }
        if (!this._sqliteDb.isOpen()) {
            throw new IllegalStateException(String.format("Closing SQLiteDb in %s although it is not started.", _tableName));
        }

        // BCEL / CGLIB code generation have been considered. Reflection
        // overhead seems reasonable. Java's annotation compile-time processing
        // seems to involve reflection anyway.
        // cf. https://stackoverflow.com/questions/435553/java-reflection-performance
        // cf. https://dzone.com/articles/java-reflection-but-faster
        // example:
        // - https://stackoverflow.com/questions/1082850/java-reflection-create-an-implementing-class/9583681#9583681
        // - http://tutorials.jenkov.com/java-reflection/dynamic-proxies.html#proxy

        // List class public field, we'll consider them as SQL table columns.

        // Convert object values to SQLite ContentValues format.
        SQLiteDatabase db = this._sqliteDb;
        ContentValues values = new ContentValues();
        for (Field field : this._classFields) {
            String fieldName = field.getName();
            Class<?> type = field.getType();
            String typeName = type.getCanonicalName();
            if (typeName == null) { // shouldn't happen.
                typeName = type.getSimpleName();
            }

            try {
                switch (typeName) {
                    case "boolean":
                    case "java.lang.Boolean":
                        values.put(fieldName, field.getBoolean(data));
                        break;
                    case "int":
                    case "java.lang.Integer":
                        values.put(fieldName, field.getInt(data));
                        break;
                    case "long":
                    case "java.lang.Long":
                        values.put(fieldName, field.getLong(data));
                        break;
                    case "float":
                    case "java.lang.Float":
                        values.put(fieldName, field.getFloat(data));
                        break;
                    case "double":
                    case "java.lang.Double":
                        values.put(fieldName, field.getDouble(data));
                        break;
                    case "java.lang.String":
                        values.put(fieldName, (String) field.get(data));
                        break;
                    default:
                        throw new IllegalStateException(String.format("Unexpected value type %s for %s in %s", typeName, fieldName, _tableName));
                }
            }
            catch (IllegalAccessException e) {
                throw new RuntimeException(e);
            }
        }

        // Insert values in DB.
        db.insert(_tableName, null, values);
    }

    // @todo remove these synchronize overhead (but double check how to first) !
    @Override
    public synchronized T read() {
        // Check db is started.
        if (this._sqliteDb == null) {
            throw new IllegalStateException(String.format("Closing SQLiteDb in %s although it is not started.", _tableName));
        }
        if (!this._sqliteDb.isOpen()) {
            throw new IllegalStateException(String.format("Closing SQLiteDb in %s although it is not started.", _tableName));
        }

        // Query data and retrieve data cursor.
        Cursor cursor = _sqliteDb.query(
                _tableName,
                null,
                null,
                null,
                null,
                null,
                // @note we use DESC instead of ASC, as latest data are more
                // relevant to predict person's behavior/mental state. Thus, we
                // want to transfer the latest stored data available, not the
                // oldest. @todo We'll be able to purge old data later to save
                // space if they never get transfered as well.
                String.format("%s DESC",this._primaryKey),
                "1"
        );

        // Return null if no data is available.
        if (cursor.getCount() == 0) {
            cursor.close();
            return null;
        }

        // Move to first (and only) item (default position is -1 instead of 0).
        cursor.moveToFirst();

        // Generate data from cursor.
        List<String> columnNames = Arrays.asList(cursor.getColumnNames());
        List<Object> rawData = new ArrayList<>();
        for (Field field : this._classFields) {
            // Move to first (and only) item (default position is -1 instead of 0).
            cursor.moveToFirst();

            String fieldName = field.getName();
            Class<?> type = field.getType();
            String typeName = type.getCanonicalName();
            if (typeName == null) { // should not happen.
                typeName = type.getSimpleName();
            }
            int sqlColumnIndex = columnNames.indexOf(fieldName);

            // Check all data class fields have corresponding sql data results.
            // @note Should not happen, except perhaps if db wasn't updated
            //     when structure changed.
            if (sqlColumnIndex == -1 || sqlColumnIndex >= cursor.getColumnCount()) {
                String errorMessage = String.format(
                        "Column not found for field %s (columns are %s)",
                        fieldName,
                        StreamSupport.stream(columnNames).collect(Collectors.joining(", "))
                );
                cursor.close();
                throw new IllegalStateException(errorMessage);
            }

            switch (typeName) {
                case "boolean":
                case "java.lang.Boolean":
                    rawData.add(cursor.getInt(sqlColumnIndex) == 0 ? false : true);
                    break;
                case "int":
                case "java.lang.Integer":
                    rawData.add(cursor.getInt(sqlColumnIndex));
                    break;
                case "long":
                case "java.lang.Long":
                    rawData.add(cursor.getLong(sqlColumnIndex));
                    break;
                case "float":
                case "java.lang.Float":
                    rawData.add(cursor.getFloat(sqlColumnIndex));
                    break;
                case "double":
                case "java.lang.Double":
                    rawData.add(cursor.getDouble(sqlColumnIndex));
                    break;
                case "java.lang.String":
                    rawData.add(cursor.getString(sqlColumnIndex));
                    break;
                default:
                    cursor.close();
                    throw new IllegalStateException("Unexpected value type: " + typeName);
            }
        }

        // Close cursor.
        cursor.close();

        // Generate class instance from data.
        T data;
        try {
            Constructor<T> classConstructor = this._classConstructor;
            data = classConstructor.newInstance(rawData.toArray());
        }
        // Rethrow checked exceptions as unchecked. Shouldn't happen though as
        // we have double checked the constructor.
        catch (IllegalAccessException | InstantiationException | InvocationTargetException e) {
            throw new RuntimeException(e);
        }

        // @todo check data class columns equals recorded values ! Had issues
        //  with constructor overloading timestamp

        // Return data.
        return data;
    }

    // @todo remove these synchronize overhead (but double check how to first) !
    public synchronized void remove(T data) {
        // Retrieve primary key class field.
        Field primaryKeyField;
        try {
            primaryKeyField = _dataClass.getDeclaredField(_primaryKey);
        }
        catch (NoSuchFieldException e) {
            throw new RuntimeException(e);
        }

        // Retrieve primary key value from data instance.
        String primaryKeyStrValue;
        Class<?> type = primaryKeyField.getType();
        String typeName = type.getCanonicalName();
        if (typeName == null) { // should not happen.
            typeName = type.getSimpleName();
        }
        try {
            switch (typeName) {
                case "boolean":
                case "java.lang.Boolean": {
                    boolean value = false;
                    value = primaryKeyField.getBoolean(data);
                    primaryKeyStrValue = value == false ? "0" : "1";
                    break;
                }
                case "int":
                case "java.lang.Integer": {
                    int value = primaryKeyField.getInt(data);
                    primaryKeyStrValue = String.valueOf(value);
                    break;
                }
                case "long":
                case "java.lang.Long": {
                    long value = primaryKeyField.getLong(data);
                    primaryKeyStrValue = String.valueOf(value);
                    break;
                }
                case "float":
                case "java.lang.Float": {
                    float value = primaryKeyField.getFloat(data);
                    primaryKeyStrValue = String.valueOf(value);
                    break;
                }
                case "double":
                case "java.lang.Double": {
                    double value = primaryKeyField.getFloat(data);
                    primaryKeyStrValue = String.valueOf(value);
                    break;
                }
                case "java.lang.String": {
                    String value = (String) primaryKeyField.get(data);
                    primaryKeyStrValue = String.valueOf(value);
                    break;
                }
                default:
                    throw new IllegalStateException("Unexpected value type: " + typeName);
            }
        }
        catch (IllegalAccessException e) {
            throw new RuntimeException(e);
        }

        int affectedRowCount = _sqliteDb.delete(_tableName, String.format("%s = ?", _primaryKey), new String[]{ primaryKeyStrValue });
        if (affectedRowCount != 1) {
            throw new IllegalStateException(String.format("Should have deleted 1 row for table %s, deleted %s row(s) instead.", _tableName, affectedRowCount));
        }
    }

    // Start / stop the sqlite db.
    // These nethods have been set private to prevent user to alter lifecycle
    // with the one controlled by the rxjava Observable in stream. This could
    // be changed.
    //
    // @warning
    // This might take a very long time to run, perhaps even more
    // with encrypted db.
    //
    // @warning This shouldn't be done from the main thread.
    // cf. https://developer.android.com/reference/android/database/sqlite/SQLiteOpenHelper#getWritableDatabase()
    private synchronized void start() {
        if (this._sqliteDb != null) {
            throw new IllegalStateException(String.format("Opening SQLiteDb in %s although it is already started.", _tableName));
        }

        this._sqliteDb = this._sqliteDBHelper.getWritableDatabase();
    }
    private synchronized void close() {
        if (this._sqliteDb == null) {
            throw new IllegalStateException(String.format("Closing SQLiteDb in %s although it is not started.", _tableName));
        }
        if (!this._sqliteDb.isOpen()) {
            throw new IllegalStateException(String.format("Closing SQLiteDb in %s although it is not started.", _tableName));
        }

        this._sqliteDb.close();
        this._sqliteDb = null;
    }

    // @note
    // We use HashMap instead of ConcurrentHashMap since we believe sequential
    // calls to ConcurrentHashMap#containsKey and ConcurrentHashMap#get are not
    // atomical. Thus we prefer relying on synchronized block instead.
    private static HashMap<String, Observable<SQLiteStore>> _cachedStreams = new HashMap<>();

    // Return a disposable sqlite db stream.
    //
    // @warning
    // This should be observed from another thread (such as db opening is
    // done from there).
    //
    // @note
    // It is often considered a bad practice to use rxjava for single item
    // instead of event.
    // cf. http://konmik.com/post/when_to_not_use_rxjava/
    //
    // This returns an observable event if only a single item is emitted
    // because it:
    // - handles auto db opening/close on observable subscription/disposal (AND
    //   enforce their usage).
    // - allow user to manage threading.
    // - (handles single instance reference counting as no more than one
    //    instance is suggested for android sqlite dbs).
    //
    // Therefore, we consider using stream simplify usage over pure instance
    // here. The constructor has been put to private to enforce the safety
    // brought by observables here.
    public static synchronized Observable<SQLiteStore> streamWriter(final Context context_, final String tableName, final Class<?> dataClass, final String primaryKey, final String... otherFields) {
        // Ensure we use an application-wide context to prevent relying on
        // destroyed context later on.
        //
        // @note
        // Caching context is not recommended, however, this code is likely
        // useless and purely for safety, as in the current workflow, context
        // will not be cached except for a very short while if the observable
        // subscription happens in another thread as context is only used once
        // at cache generation.
        final Context context = context_.getApplicationContext();

        // Generate the cached stream if it doesn't exist yet.
        if (!_cachedStreams.containsKey(tableName)) {
            Observable<SQLiteStore> stream = Observable.create(emitter -> {
                // Generate the store.
                SQLiteStore sqliteStore = new SQLiteStore(context, tableName, dataClass, primaryKey, otherFields);

                // Start the db, as we're in a subscription.
                // See method's comment for slowness info and which in which
                // context this should be to be run from performance-wise.
                sqliteStore.start();

                // Forward the store to the stream once db has opened.
                //
                // @note
                // Double check stream isn't disposed, in case stream
                // subscription and generation happens in different threads.
                if (!emitter.isDisposed()) {
                    emitter.onNext(sqliteStore);
                }

                // When the stream is unsubscribed/disposed., close the db.
                emitter.setCancellable(() -> {
                    synchronized(SQLiteStore.class) { // blocks with static method's level synchronized.
                        // Uncache stream.
                        _cachedStreams.remove(tableName);
                    }

                    // Check db is not already closed. Shouldn't happen with
                    // the current interface as close method as been set
                    // private for safety. We thus throw an exception for
                    // a better logging / issue catching.
                    if (sqliteStore._sqliteDb == null || !sqliteStore._sqliteDb.isOpen()) {
                        throw new IllegalStateException(String.format("SQLite db is already closed on stream dispose/unsubscription for %s.", tableName));
                    }

                    // Close the db.
                    sqliteStore.close();
                });
            });

            // SQLite thread-safetiness depends on compile-time options.
            // cf. https://www.sqlite.org/threadsafe.html
            //
            // For android SQLite, it's recommended to use a single SQLiteDB
            // connection across threads.
            // cf. https://stackoverflow.com/a/3689883/939741
            //
            // Due to thread-safety implementation, we thus implement reference
            // counting to the stream to enforce single db opening even if
            // streams are opened in different thread. This seems
            // counter-intuitive at first , but it's likely due to the fact
            // - SQLite helper implementation is already thread safe.
            // - multiple connection can have write get rejected for safety.
            // - multiple connection can have different db definition.
            //
            // @warning
            // Current code might reopen db at first write after unsubscription.
            // Might be better to open db straight from app launch and keep it
            // that way even when no write is done, considering opening can be
            // very slow especially with encryption.
            stream = stream
                    // Send the last emitted item on re-subscription.
                    .replay(1)
                    // Completely unsubscribe only once there is no longer any
                    // subscriber at all.
                    .refCount();

            // WritableStore the cached stream.
            _cachedStreams.put(tableName, stream);
        }

        // Return the cached stream.
        return _cachedStreams.get(tableName);
    }
}
