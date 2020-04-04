package org.pnplab.phenotype.synchronization;

import android.content.ContentValues;
import android.content.Context;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.os.Environment;

import java.io.File;
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.List;

import java9.util.stream.Collectors;
import java9.util.stream.Stream;
import java9.util.stream.StreamSupport;

// Single table SQLite database.
public class SQLiteStore extends Store {

    private final String tableName;
    private final List<Field> _classFields;
    private final SQLiteOpenHelper _sqliteDBHelper;
    private final SQLiteDatabase _sqliteDb;

    public SQLiteStore(Context context, String tableName, Class<?> dataClass) {
        this.tableName = tableName;

        this._classFields = this._getClassFields(dataClass);
        this._sqliteDBHelper = this._setupDB(context);
        this._sqliteDb = this._sqliteDBHelper.getWritableDatabase();
    }

    private List<Field> _getClassFields(Class<?> dataClass) {
        List<Field> dataFields = Stream
                .of(dataClass.getDeclaredFields())
                .filter(field -> Modifier.isPublic(field.getModifiers()))
                .collect(Collectors.toList());

        return dataFields;
    }

    private SQLiteOpenHelper _setupDB(Context context) {
        String tableName = this.tableName;

        // List class public field, we'll consider them as SQL table columns.
        Stream<Field> dataFields = StreamSupport.stream(this._classFields);

        // Pick external storage folder if available (as there is more space in
        // external storage then internal).
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
            throw new IllegalStateException("Couldn't create sqlite folder");
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
                                throw new IllegalStateException("Couldn't retrieve class canonical name when constructing sqlite db from class.");
                            }

                            // @warning Object type wrapper name might be canonical! Not tested.
                            // @todo test object name wrapper is not canonical!
                            switch (typeName) {
                                case "boolean":
                                case "int":
                                case "long":
                                case "Boolean":
                                case "Integer":
                                case "Long":
                                    return String.format("%s INTEGER", fieldName);
                                case "float":
                                case "double":
                                case "Float":
                                case "Double":
                                    return String.format("%s REAL", fieldName);
                                case "java.lang.String":
                                    // @note SQLite varchar is actually a TEXT type (length is
                                    // ignored).
                                    return String.format("%s TEXT", fieldName);
                                default:
                                    throw new IllegalStateException("Unexpected value: " + typeName);
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

    private void writeBoolean(Boolean fieldData) {

    }

    @Override
    public void write(Object data) {
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
            try {
                // @warning Object type wrapper name might be canonical! Not tested.
                // @todo test object name wrapper is not canonical!
                switch (typeName) {
                    case "boolean":
                    case "Boolean":
                        values.put(fieldName, field.getBoolean(data));
                        break;
                    case "int":
                    case "Integer":
                        values.put(fieldName, field.getInt(data));
                        break;
                    case "long":
                    case "Long":
                        values.put(fieldName, field.getLong(data));
                        break;
                    case "float":
                    case "Float":
                        values.put(fieldName, field.getFloat(data));
                        break;
                    case "double":
                    case "Double":
                        values.put(fieldName, field.getDouble(data));
                        break;
                    case "java.lang.String":
                        values.put(fieldName, (String) field.get(data));
                        break;
                    default:
                        throw new IllegalStateException("Unexpected value: " + typeName);
                }
            }
            catch (IllegalAccessException e) {
                e.printStackTrace();
            }
        }

        // Insert values in DB.
        db.insert(tableName, null, values);

        // @todo ??
    }

    // @todo call!
    public void close() {
        this._sqliteDb.close();
    }

}
