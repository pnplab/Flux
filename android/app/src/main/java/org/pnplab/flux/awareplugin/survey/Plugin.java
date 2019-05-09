package org.pnplab.flux.awareplugin.survey;

import org.pnplab.flux.R;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.database.SQLException;
import android.database.sqlite.SQLiteException;
import android.os.Bundle;

import com.aware.Aware;
import com.aware.Aware_Preferences;
import com.aware.utils.Aware_Sensor;

// import android.os.SystemClock;
import android.util.Log;

import android.os.Binder;
import android.os.IBinder;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

public class Plugin extends Aware_Sensor {

    // Binder given to clients
    private final IBinder mBinder = new LocalBinder();

    /**
     * Class used for the client Binder. Because we know this service always runs in
     * the same process as its clients, we don't need to deal with IPC.
     */
    public class LocalBinder extends Binder {
        public Plugin getService() {
            // Return this instance of Plugin so clients can call public methods
            return Plugin.this;
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return mBinder;
    }

    @Override
    protected String getAuthority() {
        // This allows plugin data to be synced on demand from broadcast. Aware#ACTION_AWARE_SYNC_DATA
        return Provider.getAuthority(this);
    }

    @Override
    public void onCreate() {

        super.onCreate();

        TAG = "pnplab.survey::Plugin";

        /**
         * Plugins share their current status, i.e., context using this method.
         * This method is called automatically when triggering
         * {@link Aware#ACTION_AWARE_CURRENT_CONTEXT}
         **/
        CONTEXT_PRODUCER = new ContextProducer() {
            @Override
            public void onContext() {
                //Broadcast your context here
            }
        };

        /*
        // @note not working ?
        //To sync data to the server, you'll need to set this variables from your ContentProvider
        DATABASE_TABLES = Provider.DATABASE_TABLES;
        TABLES_FIELDS = Provider.TABLES_FIELDS;
        CONTEXT_URIS = new Uri[]{ Provider.Survey_Data.CONTENT_URI };
        */
    }


    /**
     * Allow callback to other applications when data is stored in provider
     */
    private static AWARESensorObserver awareSensor;

    public static void setSensorObserver(AWARESensorObserver observer) {
        awareSensor = observer;
    }

    public static AWARESensorObserver getSensorObserver() {
        return awareSensor;
    }

    public interface AWARESensorObserver {
        void onDataChanged(ContentValues data);
    }

    //This function gets called every 5 minutes by AWARE to make sure this plugin is still running.
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // @warning !!! Aware launches a network request in this super method instead of using "onHandleIntent" for that.
        // This results in a crash! The network request is `SSLManager.handleUrl(getApplicationContext(), Aware.getSetting(this, Aware_Preferences.WEBSERVICE_SERVER), true);`
        // To avoid this crash, study must have been joined first before starting the plugin! Beware of unpredictable async crashes!
        super.onStartCommand(intent, flags, startId);

        Log.v("pnplab.survey::Plugin", "#onStartCommand");

        if (PERMISSIONS_OK) {
            Log.v("pnplab.survey::Plugin", "#onStartCommand permission OK");
            DEBUG = Aware.getSetting(this, Aware_Preferences.DEBUG_FLAG).equals("true");

            //Initialize our plugin's settings
            Aware.setSetting(this, Settings.STATUS_PLUGIN_SURVEY, true);

            //Enable our plugin's sync-adapter to upload the data to the server if part of a study
            if (Aware.getSetting(this, Aware_Preferences.FREQUENCY_WEBSERVICE).length() >= 0 && !Aware.isSyncEnabled(this, Provider.getAuthority(this)) && Aware.isStudy(this) && getApplicationContext().getPackageName().equalsIgnoreCase("com.aware.phone") || getApplicationContext().getResources().getBoolean(R.bool.standalone)) {
                Log.v("pnplab.survey::Plugin", "#onStartCommand configure sync");
                ContentResolver.setIsSyncable(Aware.getAWAREAccount(this), Provider.getAuthority(this), 1);
                ContentResolver.addPeriodicSync(
                        Aware.getAWAREAccount(this),
                        Provider.getAuthority(this),
                        Bundle.EMPTY,
                        Long.parseLong(Aware.getSetting(this, Aware_Preferences.FREQUENCY_WEBSERVICE)) * 60
                );
            }

            //Initialise AWARE instance in plugin
            Aware.startAWARE(this);
        }
        else {
            Log.w("pnplab.survey::Plugin", "#onStartCommand error: permission not OK");
        }

        return START_STICKY;
    }

    public void storeSurvey(long timestamp, Map<String, Double> content) {
        Log.v("pnplab.survey::Plugin", "#storeSurvey");

        String deviceId = Aware.getSetting(this, Aware_Preferences.DEVICE_ID);
        // long timestamp = System.currentTimeMillis();
        String formId = UUID.randomUUID().toString();

        Set<ContentValues> context_datas = new HashSet<ContentValues>(content.size());
        for (Map.Entry<String, Double> entry : content.entrySet()) {
            ContentValues context_data = new ContentValues();
            context_data.put(Provider.Survey_Data.TIMESTAMP, timestamp);
            context_data.put(Provider.Survey_Data.DEVICE_ID, deviceId);
            context_data.put(Provider.Survey_Data.FORM_ID, formId);
            context_data.put(Provider.Survey_Data.QUESTION_ID, entry.getKey());
            context_data.put(Provider.Survey_Data.VALUE, entry.getValue());
            context_datas.add(context_data);
            Log.v("pnplab.survey::Plugin", String.format("#storeSurvey - Storing survey %s data timestamp=%s %s=%s", formId, timestamp, entry.getKey(), entry.getValue()));
        }

        try {
            Log.v("pnplab.survey::Plugin", "#storeSurvey - insert data in db");
            getContentResolver().bulkInsert(Provider.Survey_Data.CONTENT_URI, context_datas.toArray(new ContentValues[context_datas.size()]));
        } catch (SQLiteException e) {
            Log.v("pnplab.survey::Plugin", "#storeSurvey - SQLiteException");
            if (Aware.DEBUG) Log.d(TAG, e.getMessage());
        } catch (SQLException e) {
            Log.v("pnplab.survey::Plugin", "#storeSurvey - SQLException");
            if (Aware.DEBUG) Log.d(TAG, e.getMessage());
        } catch (Exception e) {
            Log.v("pnplab.survey::Plugin", "#storeSurvey - Exception");
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();

        Log.v("pnplab.survey::Plugin", "#onDestroy");

        //Turn off the sync-adapter if part of a study
        if (Aware.isStudy(this) && (getApplicationContext().getPackageName().equalsIgnoreCase("com.aware.phone") || getApplicationContext().getResources().getBoolean(R.bool.standalone))) {
            Log.v("pnplab.survey::Plugin", "#onDestroy - unset automatic sync");

            ContentResolver.removePeriodicSync(
                    Aware.getAWAREAccount(this),
                    Provider.getAuthority(this),
                    Bundle.EMPTY
            );
        }

        Aware.setSetting(this, Settings.STATUS_PLUGIN_SURVEY, false);

        //Stop AWARE instance in plugin
        Aware.stopAWARE(this);
    }

}