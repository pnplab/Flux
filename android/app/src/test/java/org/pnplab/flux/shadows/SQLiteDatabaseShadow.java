package org.pnplab.flux.shadows;

import android.util.Log;

import net.sqlcipher.database.SQLiteDatabase;

import org.codehaus.plexus.context.Context;
import org.robolectric.annotation.Implementation;
import org.robolectric.annotation.Implements;

import java.io.File;

@Implements(SQLiteDatabase.class)
public class SQLiteDatabaseShadow extends SQLiteClosableShadow {

    public SQLiteDatabaseShadow() {

    }

    // @RealObject private android.database.sqlite.SQLiteDatabase sqliteDatabase;

    // String SQLCIPHER_ANDROID_VERSION = net.sqlcipher.database.SQLiteDatabase.SQLCIPHER_ANDROID_VERSION;
    // String MEMORY = net.sqlcipher.database.SQLiteDatabase.MEMORY;

    // int CONFLICT_ROLLBACK = android.database.sqlite.SQLiteDatabase.CONFLICT_ROLLBACK;
    // int CONFLICT_ABORT = android.database.sqlite.SQLiteDatabase.CONFLICT_ABORT;
    // int CONFLICT_FAIL = android.database.sqlite.SQLiteDatabase.CONFLICT_FAIL;
    // int CONFLICT_IGNORE = android.database.sqlite.SQLiteDatabase.CONFLICT_IGNORE;
    // int CONFLICT_REPLACE = android.database.sqlite.SQLiteDatabase.CONFLICT_REPLACE;
    // int CONFLICT_NONE = android.database.sqlite.SQLiteDatabase.CONFLICT_NONE;
    // int SQLITE_MAX_LIKE_PATTERN_LENGTH = android.database.sqlite.SQLiteDatabase.SQLITE_MAX_LIKE_PATTERN_LENGTH;
    // int OPEN_READWRITE = android.database.sqlite.SQLiteDatabase.OPEN_READWRITE;
    // int OPEN_READONLY = android.database.sqlite.SQLiteDatabase.OPEN_READONLY;
    // int NO_LOCALIZED_COLLATORS = android.database.sqlite.SQLiteDatabase.NO_LOCALIZED_COLLATORS;
    // int CREATE_IF_NECESSARY = android.database.sqlite.SQLiteDatabase.CREATE_IF_NECESSARY;
    // int MAX_SQL_CACHE_SIZE = android.database.sqlite.SQLiteDatabase.MAX_SQL_CACHE_SIZE;

    @Implementation
    protected static synchronized void loadLibs (Context context) {
        // Do nothing...
    }

    @Implementation
    protected static synchronized void loadLibs (Context context, File workingDir) {
        // Do nothing...
    }

    @Implementation
    protected static synchronized void loadLibs(Context context, SQLiteDatabase.LibraryLoader libraryLoader) {
        // Do nothing...
    }

    @Implementation
    protected static synchronized void loadLibs(Context context, File workingDir, SQLiteDatabase.LibraryLoader libraryLoader) {
        // Do nothing...
    }

    /*

    static int releaseMemory() {
        return android.database.sqlite.SQLiteDatabase.releaseMemory();
    }

    static SQLiteDatabase openDatabase(String path, String password, CursorFactory factory, int flags) {
      return android.database.sqlite.SQLiteDatabase.openDatabase(path, password, factory, flags, null);
    }

    static SQLiteDatabase openDatabase(String path, char[] password, CursorFactory factory, int flags) {
      return android.database.sqlite.SQLiteDatabase.openDatabase(path, password, factory, flags, null, null);
    }

    static SQLiteDatabase openDatabase(String path, String password, CursorFactory factory, int flags, SQLiteDatabaseHook hook) {
      return android.database.sqlite.SQLiteDatabase.openDatabase(path, password, factory, flags, hook, null);
    }

    static SQLiteDatabase openDatabase(String path, char[] password, CursorFactory factory, int flags, SQLiteDatabaseHook hook) {
      return android.database.sqlite.SQLiteDatabase.openDatabase(path, password, factory, flags, hook, null);
    }

    static SQLiteDatabase openDatabase(String path, String password, CursorFactory factory, int flags,
                                       SQLiteDatabaseHook hook, DatabaseErrorHandler errorHandler) {
      return android.database.sqlite.SQLiteDatabase.openDatabase(path, password == null ? null : password.toCharArray(), factory, flags, hook, errorHandler);
    }

    static SQLiteDatabase openDatabase(String path, char[] password, CursorFactory factory, int flags,
                                       SQLiteDatabaseHook hook, DatabaseErrorHandler errorHandler) {
      byte[] keyMaterial = getBytes(password);
      return android.database.sqlite.SQLiteDatabase.openDatabase(path, keyMaterial, factory, flags, hook, errorHandler);
    }

    static SQLiteDatabase openDatabase(String path, byte[] password, CursorFactory factory, int flags,
                                       SQLiteDatabaseHook hook, DatabaseErrorHandler errorHandler) {
      SQLiteDatabase sqliteDatabase = null;
      DatabaseErrorHandler myErrorHandler = (errorHandler != null) ? errorHandler : new DefaultDatabaseErrorHandler();

      try {
        // Open the database.
        sqliteDatabase = new SQLiteDatabase(path, factory, flags, myErrorHandler);
        sqliteDatabase.openDatabaseInternal(password, hook);
      } catch (SQLiteDatabaseCorruptException e) {
        // Try to recover from this, if possible.
        // FUTURE TBD: should we consider this for other open failures?

        if(BuildConfig.DEBUG){
          Log.e(SQLiteDatabase.TAG, "Calling error handler for corrupt database " + path, e);
        }

        // NOTE: if this errorHandler.onCorruption() throws the exception _should_
        // bubble back to the original caller.
        // DefaultDatabaseErrorHandler deletes the corrupt file, EXCEPT for memory database
        myErrorHandler.onCorruption(sqliteDatabase);

        // try *once* again:
        sqliteDatabase = new SQLiteDatabase(path, factory, flags, myErrorHandler);
        sqliteDatabase.openDatabaseInternal(password, hook);
      }

      if (SQLiteDebug.DEBUG_SQL_STATEMENTS) {
        sqliteDatabase.enableSqlTracing(path);
      }
      if (SQLiteDebug.DEBUG_SQL_TIME) {
        sqliteDatabase.enableSqlProfiling(path);
      }

      synchronized (SQLiteDatabase.sActiveDatabases) {
        SQLiteDatabase.sActiveDatabases.put(sqliteDatabase, null);
      }

      return sqliteDatabase;
    }

    static SQLiteDatabase openOrCreateDatabase(File file, String password, CursorFactory factory, SQLiteDatabaseHook databaseHook) {
      return android.database.sqlite.SQLiteDatabase.openOrCreateDatabase(file, factory, databaseHook, null);
    }

    static SQLiteDatabase openOrCreateDatabase(File file, String password, CursorFactory factory, SQLiteDatabaseHook databaseHook,
                                               DatabaseErrorHandler errorHandler) {
      return android.database.sqlite.SQLiteDatabase.openOrCreateDatabase(file == null ? null : file.getPath(), factory, databaseHook, errorHandler);
    }

    static SQLiteDatabase openOrCreateDatabase(String path, String password, CursorFactory factory, SQLiteDatabaseHook databaseHook) {
      return android.database.sqlite.SQLiteDatabase.openDatabase(path, factory, CREATE_IF_NECESSARY, databaseHook);
    }

    static SQLiteDatabase openOrCreateDatabase(String path, String password, CursorFactory factory, SQLiteDatabaseHook databaseHook,
                                               DatabaseErrorHandler errorHandler) {
      return android.database.sqlite.SQLiteDatabase.openDatabase(path, password == null ? null : password.toCharArray(), factory, CREATE_IF_NECESSARY, databaseHook, errorHandler);
    }

    static SQLiteDatabase openOrCreateDatabase(String path, char[] password, CursorFactory factory, SQLiteDatabaseHook databaseHook) {
      return android.database.sqlite.SQLiteDatabase.openDatabase(path, password, factory, CREATE_IF_NECESSARY, databaseHook);
    }

    static SQLiteDatabase openOrCreateDatabase(String path, char[] password, CursorFactory factory, SQLiteDatabaseHook databaseHook,
                                               DatabaseErrorHandler errorHandler) {
      return android.database.sqlite.SQLiteDatabase.openDatabase(path, password, factory, CREATE_IF_NECESSARY, databaseHook, errorHandler);
    }

    static SQLiteDatabase openOrCreateDatabase(String path, byte[] password, CursorFactory factory, SQLiteDatabaseHook databaseHook) {
      return android.database.sqlite.SQLiteDatabase.openDatabase(path, password, factory, CREATE_IF_NECESSARY, databaseHook, null);
    }

    static SQLiteDatabase openOrCreateDatabase(String path, byte[] password, CursorFactory factory, SQLiteDatabaseHook databaseHook,
                                               DatabaseErrorHandler errorHandler) {
      return android.database.sqlite.SQLiteDatabase.openDatabase(path, password, factory, CREATE_IF_NECESSARY, databaseHook, errorHandler);
    }

    static SQLiteDatabase openOrCreateDatabase(File file, String password, CursorFactory factory) {
      return openOrCreateDatabase(file, password, factory, null);
    }

    static SQLiteDatabase openOrCreateDatabase(String path, String password, CursorFactory factory) {
      return android.database.sqlite.SQLiteDatabase.openDatabase(path, password, factory, CREATE_IF_NECESSARY, null);
    }

    static SQLiteDatabase openOrCreateDatabase(String path, char[] password, CursorFactory factory) {
      return android.database.sqlite.SQLiteDatabase.openDatabase(path, password, factory, CREATE_IF_NECESSARY, null);
    }

    static SQLiteDatabase openOrCreateDatabase(String path, byte[] password, CursorFactory factory) {
      return android.database.sqlite.SQLiteDatabase.openDatabase(path, password, factory, CREATE_IF_NECESSARY, null, null);
    }

    static SQLiteDatabase create(CursorFactory factory, String password) {
      // This is a magic string with special meaning for SQLite.
      return android.database.sqlite.SQLiteDatabase.openDatabase(MEMORY, password == null ? null : password.toCharArray(), factory, CREATE_IF_NECESSARY);
    }

    static SQLiteDatabase create(CursorFactory factory, char[] password) {
      return android.database.sqlite.SQLiteDatabase.openDatabase(MEMORY, password, factory, CREATE_IF_NECESSARY);
    }

    static String findEditTable(String tables) {
        if (!TextUtils.isEmpty(tables)) {
            // find the first word terminated by either a space or a comma
            int spacepos = tables.indexOf(' ');
            int commapos = tables.indexOf(',');

            if (spacepos > 0 && (spacepos < commapos || commapos < 0)) {
                return tables.substring(0, spacepos);
            } else if (commapos > 0 && (commapos < spacepos || spacepos < 0) ) {
                return tables.substring(0, commapos);
            }
            return tables;
        } else {
            throw new IllegalStateException("Invalid tables");
        }
    }

    static byte[] getBytes(char[] data) {
        if(data == null || data.length == 0) return null;
        CharBuffer charBuffer = CharBuffer.wrap(data);
        ByteBuffer byteBuffer = Charset.forName(SQLiteDatabase.KEY_ENCODING).encode(charBuffer);
        byte[] result =  new byte[byteBuffer.limit()];
        byteBuffer.get(result);
        return result;
    }

    static char[] getChars(byte[] data){
        if(data == null || data.length == 0) return null;
        ByteBuffer byteBuffer = ByteBuffer.wrap(data);
        CharBuffer charBuffer = Charset.forName(SQLiteDatabase.KEY_ENCODING).decode(byteBuffer);
        char[] result = new char[charBuffer.limit()];
        charBuffer.get(result);
        return result;
    }

    static void setICURoot(String path);

    int status(int operation, boolean reset);

    void changePassword(String password) throws SQLiteException;

    void changePassword(char[] password) throws SQLiteException;

    void setLockingEnabled(boolean lockingEnabled);

    boolean isDatabaseIntegrityOk();

    List<Pair<String, String>> getAttachedDbs();

    boolean enableWriteAheadLogging();

    void disableWriteAheadLogging();

    boolean isWriteAheadLoggingEnabled();

    void setForeignKeyConstraintsEnabled(boolean enable);

    void beginTransaction();

    void beginTransactionWithListener(SQLiteTransactionListener transactionListener);

    void beginTransactionNonExclusive();

    void beginTransactionWithListenerNonExclusive(SQLiteTransactionListener transactionListener);

    void endTransaction();

    void setTransactionSuccessful();

    boolean inTransaction();

    boolean isDbLockedByCurrentThread();

    boolean isDbLockedByOtherThreads();

    @Deprecated
    boolean yieldIfContended();

    boolean yieldIfContendedSafely();

    boolean yieldIfContendedSafely(long sleepAfterYieldDelay);

    Map<String, String> getSyncedTables();

    void close();

    int getVersion();

    void setVersion(int version);

    long getMaximumSize();

    long setMaximumSize(long numBytes);

    long getPageSize();

    void setPageSize(long numBytes);

    void markTableSyncable(String table, String deletedTable);

    void markTableSyncable(String table, String foreignKey,
                           String updateTable);

    SQLiteStatement compileStatement(String sql) throws SQLException;

    Cursor query(boolean distinct, String table, String[] columns,
                 String selection, String[] selectionArgs, String groupBy,
                 String having, String orderBy, String limit);

    Cursor queryWithFactory(CursorFactory cursorFactory,
                            boolean distinct, String table, String[] columns,
                            String selection, String[] selectionArgs, String groupBy,
                            String having, String orderBy, String limit);

    Cursor query(String table, String[] columns, String selection,
                 String[] selectionArgs, String groupBy, String having,
                 String orderBy);

    Cursor query(String table, String[] columns, String selection,
                 String[] selectionArgs, String groupBy, String having,
                 String orderBy, String limit);

    Cursor rawQuery(String sql, String[] selectionArgs);

    SQLiteQueryStats getQueryStats(String sql, Object[] args);

    Cursor rawQuery(String sql, Object[] args);

    Cursor rawQueryWithFactory(
            CursorFactory cursorFactory, String sql, String[] selectionArgs,
            String editTable);

    Cursor rawQuery(String sql, String[] selectionArgs,
                    int initialRead, int maxRead);

    long insert(String table, String nullColumnHack, ContentValues values);

    long insertOrThrow(String table, String nullColumnHack, ContentValues values)
        throws SQLException;

    long replace(String table, String nullColumnHack, ContentValues initialValues);

    long replaceOrThrow(String table, String nullColumnHack,
                        ContentValues initialValues) throws SQLException;

    long insertWithOnConflict(String table, String nullColumnHack,
                              ContentValues initialValues, int conflictAlgorithm);

    int delete(String table, String whereClause, String[] whereArgs);

    int update(String table, ContentValues values, String whereClause, String[] whereArgs);

    int updateWithOnConflict(String table, ContentValues values,
                             String whereClause, String[] whereArgs, int conflictAlgorithm);

    void execSQL(String sql) throws SQLException;

    void rawExecSQL(String sql);

    void execSQL(String sql, Object[] bindArgs) throws SQLException;

    boolean isReadOnly();

    boolean isOpen();

    boolean needUpgrade(int newVersion);

    String getPath();

    void setLocale(Locale locale);

    boolean isInCompiledSqlCache(String sql);

    void purgeFromCompiledSqlCache(String sql);

    void resetCompiledSqlCache();

    int getMaxSqlCacheSize();

    void setMaxSqlCacheSize(int cacheSize);

    public enum SQLiteDatabaseTransactionType {
      Deferred,
      Immediate,
      Exclusive,
    }

    public interface LibraryLoader {
      void loadLibraries(String... libNames);
    }

    public interface CursorFactory {
      public Cursor newCursor(SQLiteDatabase db,
                              SQLiteCursorDriver masterQuery, String editTable,
                              SQLiteQuery query);
    }

    public static class SyncUpdateInfo {
      SyncUpdateInfo(String masterTable, String deletedTable,
                     String foreignKey) {
        this.masterTable = masterTable;
        this.deletedTable = deletedTable;
        this.foreignKey = foreignKey;
      }

      String masterTable;

      String deletedTable;

    }

    */
}
