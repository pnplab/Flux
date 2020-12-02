package org.pnplab.stressoncovid19;

import android.content.Context;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.os.Environment;

import org.pnplab.phenotype.synchronization.dataflow.OrderedReflectionHelper;

import java.io.File;
import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;

import java9.util.stream.Stream;
import java9.util.stream.StreamSupport;

public class LogSQLiteReader {

    public static class LogTimePoint {
        public final long timestamp;
        public final String level;
        public final String log;

        public LogTimePoint(long timestamp, String level, String log) {
            this.timestamp = timestamp;
            this.level = level;
            this.log = log;
        }
    }

    private final String _primaryKey;
    private final List<Field> _classFields;
    private final Class<LogTimePoint> _dataClass;
    private final Constructor<LogTimePoint> _classConstructor;
    private final SQLiteOpenHelper _sqliteDBHelper;
    private SQLiteDatabase _sqliteDb;

    // Constructor set to private to enforce using the #stream method, in order
    // to keep the store/db lifecycle and stream licycles both bound together.
    // This could be changed.
    private LogSQLiteReader(Context context) {
        this._dataClass = LogTimePoint.class;

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
        this._primaryKey = "timestamp";

        // 2. Convert ordered field names to list.
        List<String> orderedFieldNames = new ArrayList<>();
        orderedFieldNames.add("timestamp");
        orderedFieldNames.add("log");
        orderedFieldNames.add("level");

        OrderedReflectionHelper orderedReflectionHelper = new OrderedReflectionHelper<LogSQLiteReader>(this._dataClass, orderedFieldNames.toArray(new String[0]));
        orderedReflectionHelper.validateOrThrow();

        this._classFields = orderedReflectionHelper.getFields();

        // Register class constructor.
        this._classConstructor = orderedReflectionHelper.getConstructor();

        // Setup db.
        this._sqliteDBHelper = this._setupDB(context, "timestamp", this._classFields);
    }

    // @warning
    // We consider SQLite Helper thread-safety goes as far as ensuring onCreate
    // db callback are either synchronous or later call are delayed.
    // According to doc, "Transactions are used to make sure the database is
    // always in a sensible state".
    private SQLiteOpenHelper _setupDB(Context context, String primaryKey, final List<Field> classFields) {
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
            throw new IllegalStateException(String.format("Couldn't create sqlite folder for table %s.", "log"));
        }
        String sqliteDBPath = String.format("%s/%s.db", dbFolder.getAbsolutePath(), "log");

        // Setup SQLite database.
        final int databaseVersion = 1;
        SQLiteOpenHelper sqliteOpenHelper = new SQLiteOpenHelper(context, sqliteDBPath, null, databaseVersion) {
            @Override
            public void onCreate(SQLiteDatabase db) {
                // Table should already exists as it's supposed to be created
                // by logback-android sqlite appender.
            }

            @Override
            public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
                throw new RuntimeException("Database upgrade not implemented.");
            }

            @Override
            public void onDowngrade(SQLiteDatabase db, int oldVersion, int newVersion) {
                onUpgrade(db, oldVersion, newVersion);
            }
        };

        return sqliteOpenHelper;
    }


    public LogTimePoint read() {
        new LogTimePoint();
    }

    public void delete(LogTimePoint entry) {

    }
}
