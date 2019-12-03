package org.pnplab.flux.surveytask.model;

import android.content.ContentProvider;
import android.content.ContentUris;
import android.content.ContentValues;
import android.content.Context;
import android.content.UriMatcher;
import android.database.Cursor;
import android.database.SQLException;
import net.sqlcipher.database.SQLiteDatabase;
import net.sqlcipher.database.SQLiteQueryBuilder;
import android.net.Uri;
import android.provider.BaseColumns;
import android.util.Log;

import com.aware.Aware;
import com.aware.utils.DatabaseHelper;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;

public class SurveyDataProvider extends ContentProvider {

    public static final int DATABASE_VERSION = 1;

    /**
     * Authority of Screen content provider
     */
    public static String AUTHORITY = "org.pnplab.flux.provider.survey";

    // ContentProvider query paths
    private static final int SURVEY = 1;
    private static final int SURVEY_ID = 2;

    /**
     * Network content representation
     *
     * @author denzil
     */
    public static final class Survey_Data implements BaseColumns {
        private Survey_Data() {
        }

        public static final Uri CONTENT_URI = Uri.parse("content://" + SurveyDataProvider.AUTHORITY + "/survey");
        public static final String CONTENT_TYPE = "vnd.android.cursor.dir/vnd.pnplab.survey";
        public static final String CONTENT_ITEM_TYPE = "vnd.android.cursor.item/vnd.pnplab.survey";

        public static final String _ID = "_id";
        public static final String TIMESTAMP = "timestamp"; // @warning must be the same real format as aware for further time-based sync comparison !
        public static final String DEVICE_ID = "device_id";
        public static final String FORM_ID = "form_id";
        public static final String QUESTION_ID = "question_id";
        public static final String VALUE = "double_value"; //a double_ prefix makes a MySQL DOUBLE column
    }

    public static String DATABASE_NAME = "survey.db";

    public static final String[] DATABASE_TABLES = {"survey"};
    public static final String[] TABLES_FIELDS = {
            // survey
              Survey_Data._ID + " integer primary key autoincrement,"
            + Survey_Data.TIMESTAMP + " real default 0,"
            + Survey_Data.DEVICE_ID + " text default '',"
            + Survey_Data.FORM_ID + " text default '',"
            + Survey_Data.QUESTION_ID + " text default '',"
            + Survey_Data.VALUE + " real default 0"
    };

    private UriMatcher sUriMatcher = null;
    private HashMap<String, String> surveyMap = null;

    private DatabaseHelper dbHelper;
    private static SQLiteDatabase database;

    private void initialiseDatabase() {
        if (dbHelper == null)
            dbHelper = new DatabaseHelper(getContext(), DATABASE_NAME, null, DATABASE_VERSION, DATABASE_TABLES, TABLES_FIELDS);
        if (database == null)
            database = dbHelper.getWritableDatabase();
    }

    /**
     * Delete entry from the database
     */
    @Override
    public synchronized int delete(Uri uri, String selection, String[] selectionArgs) {
        initialiseDatabase();

        //lock database for transaction
        database.beginTransaction();

        int count = 0;
        switch (sUriMatcher.match(uri)) {
            case SURVEY:
                count = database.delete(DATABASE_TABLES[0], selection,
                        selectionArgs);
                break;
            default:
                database.endTransaction();
                throw new IllegalArgumentException("Unknown URI " + uri);
        }

        database.setTransactionSuccessful();
        database.endTransaction();

        getContext().getContentResolver().notifyChange(uri, null, false);
        return count;
    }

    @Override
    public String getType(Uri uri) {
        switch (sUriMatcher.match(uri)) {
            case SURVEY:
                return Survey_Data.CONTENT_TYPE;
            case SURVEY_ID:
                return Survey_Data.CONTENT_ITEM_TYPE;
            default:
                throw new IllegalArgumentException("Unknown URI " + uri);
        }
    }

    private void printContentValues(ContentValues vals)
    {
       Set<Map.Entry<String, Object>> s=vals.valueSet();
       Iterator itr = s.iterator();

       while(itr.hasNext())
       {
            Map.Entry me = (Map.Entry)itr.next();
            String key = me.getKey().toString();
            Object value =  me.getValue();
       }
    }
    /**
     * Insert entry to the database
     */
    @Override
    public synchronized Uri insert(Uri uri, ContentValues initialValues) {
        printContentValues(initialValues);

        initialiseDatabase();

        ContentValues values = (initialValues != null) ? new ContentValues(initialValues) : new ContentValues();

        database.beginTransaction();

        switch (sUriMatcher.match(uri)) {
            case SURVEY:
                long survey_id = database.insertWithOnConflict(DATABASE_TABLES[0],
                        Survey_Data.DEVICE_ID, values, SQLiteDatabase.CONFLICT_IGNORE);
                database.setTransactionSuccessful();
                database.endTransaction();
                if (survey_id > 0) {
                    Uri surveyUri = ContentUris.withAppendedId(
                            Survey_Data.CONTENT_URI, survey_id);
                    getContext().getContentResolver().notifyChange(surveyUri, null, false);
                    return surveyUri;
                }
                database.endTransaction();
                throw new SQLException("Failed to insert row into " + uri);
            default:
                database.endTransaction();
                throw new IllegalArgumentException("Unknown URI " + uri);
        }
    }

    /**
     * Returns the provider authority that is dynamic
     * @return
     */
    public static String getAuthority(Context context) {
        AUTHORITY = "org.pnplab.flux.provider.survey";
        return AUTHORITY;
    }

    @Override
    public boolean onCreate() {
        AUTHORITY = "org.pnplab.flux.provider.survey";

        sUriMatcher = new UriMatcher(UriMatcher.NO_MATCH);
        sUriMatcher.addURI(SurveyDataProvider.AUTHORITY, DATABASE_TABLES[0],
                SURVEY);
        sUriMatcher.addURI(SurveyDataProvider.AUTHORITY, DATABASE_TABLES[0]
                + "/#", SURVEY_ID);

        surveyMap = new HashMap<String, String>();
        surveyMap.put(Survey_Data._ID, Survey_Data._ID);
        surveyMap.put(Survey_Data.TIMESTAMP, Survey_Data.TIMESTAMP);
        surveyMap.put(Survey_Data.DEVICE_ID, Survey_Data.DEVICE_ID);
        surveyMap.put(Survey_Data.FORM_ID, Survey_Data.FORM_ID);
        surveyMap.put(Survey_Data.QUESTION_ID, Survey_Data.QUESTION_ID);
        surveyMap.put(Survey_Data.VALUE, Survey_Data.VALUE);

        return true;
    }

    /**
     * Query entries from the database
     */
    @Override
    public Cursor query(Uri uri, String[] projection, String selection,
                        String[] selectionArgs, String sortOrder) {

        initialiseDatabase();

        SQLiteQueryBuilder qb = new SQLiteQueryBuilder();
        // qb.setStrict(true);
        switch (sUriMatcher.match(uri)) {
            case SURVEY:
                qb.setTables(DATABASE_TABLES[0]);
                qb.setProjectionMap(surveyMap);
                break;
            default:

                throw new IllegalArgumentException("Unknown URI " + uri);
        }
        try {
            Cursor c = qb.query(database, projection, selection, selectionArgs,
                    null, null, sortOrder);
            c.setNotificationUri(getContext().getContentResolver(), uri);
            return c;
        } catch (IllegalStateException e) {
            if (Aware.DEBUG)
                Log.e(Aware.TAG, e.getMessage());

            return null;
        }
    }

    /**
     * Update application on the database
     */
    @Override
    public synchronized int update(Uri uri, ContentValues values, String selection,
                      String[] selectionArgs) {

        initialiseDatabase();

        database.beginTransaction();

        int count = 0;
        switch (sUriMatcher.match(uri)) {
            case SURVEY:
                count = database.update(DATABASE_TABLES[0], values, selection,
                        selectionArgs);
                break;
            default:
                database.endTransaction();
                throw new IllegalArgumentException("Unknown URI " + uri);
        }

        database.setTransactionSuccessful();
        database.endTransaction();

        getContext().getContentResolver().notifyChange(uri, null, false);
        return count;
    }
}
