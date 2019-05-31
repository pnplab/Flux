package org.pnplab.flux;

import android.content.BroadcastReceiver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.database.DatabaseUtils;
import android.net.Uri;
import android.util.Log;
import android.widget.Toast;

import com.aware.Applications;
import com.aware.Aware;
import com.aware.Aware_Preferences;
import com.aware.providers.Aware_Provider;
import com.aware.utils.DatabaseHelper;
import com.aware.utils.Http;
import com.aware.utils.Https;
import com.aware.utils.SSLManager;
import com.aware.utils.Scheduler;
import com.aware.utils.StudyUtils;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.pnplab.flux.awareplugin.survey.Survey;

import java.io.FileNotFoundException;
import java.util.ArrayList;
import java.util.Hashtable;
import java.util.List;

public class AwareManagerModule extends ReactContextBaseJavaModule {

    private Survey _survey;

    public AwareManagerModule(ReactApplicationContext reactContext) {
        super(reactContext);

        // Listen to aware sync events.
        IntentFilter filter = new IntentFilter();
        filter.addAction(Aware.ACTION_AWARE_SYNC_DATA_STARTED);
        filter.addAction(Aware.ACTION_AWARE_SYNC_DATA_BATCH_STARTED);
        filter.addAction(Aware.ACTION_AWARE_SYNC_DATA_FINISHED);
        filter.addAction(Aware.ACTION_AWARE_SYNC_DATA_FAILED);
        reactContext.registerReceiver(this.syncEventListener, filter);
    }

    @Override
    public void onCatalystInstanceDestroy() {
        // Unlisten aware sync events.
        getReactApplicationContext().unregisterReceiver(this.syncEventListener);
    }

    @Override
    public String getName() {
        return "AwareManager";
    }

    @ReactMethod
    public void startAware(String participantId, String encryptionKey) {
        ReactApplicationContext context = getReactApplicationContext();

        // Set db encryption key (the key can be modified through script).
        DatabaseHelper.DB_ENCRYPTION_KEY = encryptionKey;

        Aware.DEBUG = BuildConfig.DEBUG;

        if (!Aware.IS_CORE_RUNNING) {
            Intent aware = new Intent(context, Aware.class);
            context.startService(aware);
        }

        Aware.setSetting(context, Aware_Preferences.DEBUG_FLAG, BuildConfig.DEBUG);
        Applications.isAccessibilityServiceActive(context);
        Aware.isBatteryOptimizationIgnored(context, context.getPackageName());

        // @warning AWARE device_id is random UUID which makes it untraceable. We need to specify a
        //     static device_id. We use manually mapped participant id.
        Aware.setSetting(context, Aware_Preferences.DEVICE_ID, participantId);

        // Start Aware (mainly as this starts scheduler and thus ask permission requests which is
        // required before joining study)
        // @warning However, atm, aware permission request appears to be buggy when used with
        //      react-native! permission should be requested before #startAware is called!).
        Aware.startAWARE(getReactApplicationContext().getApplicationContext());

        // Create aware plugin interfaces (but don't start them until the study has been joined).
        _survey = new Survey();
    }

    @ReactMethod
    public void stopAware() {
        ReactApplicationContext context = getReactApplicationContext();

        Aware.stopAWARE(context);
    }

    @ReactMethod
    public void joinStudy(String studyUrl, Promise promise) {
        ReactApplicationContext context = getReactApplicationContext();

        // Resolve promise once study has been joined.
        BroadcastReceiver broadcastReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                // Unregister receiver on first event received ! (listen only once)
                context.unregisterReceiver(this);
                Log.w(Aware.TAG, "---- STUDY JOINED LIST");
                // Resolve promise.
                promise.resolve(null);
            }
        };
        IntentFilter filter = new IntentFilter();
        filter.addAction(Aware.ACTION_JOINED_STUDY);
        context.registerReceiver(broadcastReceiver, filter);

        // Join study.
        Aware.joinStudy(context, studyUrl);
        // this.__joinStudy(context, studyUrl);

        // Start survey plugin
        _survey.start(context);

        // @warning this will cause issue if joinStudy is called more then once!
        _survey.bind(context);
    }

    @ReactMethod
    public void addSurveyData(int timestamp, ReadableMap values) {
        _survey.addSurveyData(timestamp, values);
    }

    @ReactMethod
    public void syncData() {
        ReactApplicationContext context = getReactApplicationContext();

        Log.d("AwareManager", "broadcasting Aware.ACTION_AWARE_SYNC_DATA");

        // Ask aware to sync data.
        Intent sync = new Intent(Aware.ACTION_AWARE_SYNC_DATA);
        context.sendBroadcast(sync);
    }

    @ReactMethod
    public void getDeviceId(Promise promise) {
        ReactApplicationContext context = getReactApplicationContext();
        String deviceId = Aware.getSetting(context, Aware_Preferences.DEVICE_ID);

        promise.resolve(deviceId);
    }
    
    @ReactMethod    
    public void enableAutomaticSync() {
        ReactApplicationContext context = getReactApplicationContext();

        Aware.setSetting(context, Aware_Preferences.STATUS_WEBSERVICE, "true");
    }
    @ReactMethod
    public void disableAutomaticSync() {
        ReactApplicationContext context = getReactApplicationContext();

        Aware.setSetting(context, Aware_Preferences.STATUS_WEBSERVICE, "false");
    }    
    @ReactMethod
    public void enableMandatoryWifiForSync() {
        ReactApplicationContext context = getReactApplicationContext();

        Aware.setSetting(context, Aware_Preferences.WEBSERVICE_WIFI_ONLY, "true");
    }
    @ReactMethod
    public void disableMandatoryWifiForSync() {
        ReactApplicationContext context = getReactApplicationContext();

        Aware.setSetting(context, Aware_Preferences.WEBSERVICE_WIFI_ONLY, "false");
    }
    @ReactMethod
    public void enableMandatoryBatteryForSync() {
        ReactApplicationContext context = getReactApplicationContext();

        Aware.setSetting(context, Aware_Preferences.WEBSERVICE_CHARGING, "true");
    }
    @ReactMethod
    public void disableMandatoryBatteryForSync() {
        ReactApplicationContext context = getReactApplicationContext();

        Aware.setSetting(context, Aware_Preferences.WEBSERVICE_CHARGING, "false");
    }

    // Forward aware sync event updates to javascript.
    //   * Aware.ACTION_AWARE_SYNC_DATA_STARTED
    //        `TABLE`: string
    //        `ROW_COUNT`: number
    //   * Aware.ACTION_AWARE_SYNC_DATA_BATCH_STARTED
    //        `TABLE`: string
    //        `ROW_COUNT`: number
    //        `LAST_ROW_UPLOADED`: number
    //   * Aware.ACTION_AWARE_SYNC_DATA_FINISHED
    //        `TABLE`: string
    //   * Aware.ACTION_AWARE_SYNC_DATA_FAILED
    //        `TABLE`: string
    //        `ERROR`: string
    //               | `NO_STUDY_SET`
    //               | `OUT_OF_MEMORY`
    //               | `TABLE_CREATION_FAILED`
    //               | `SERVER_UNREACHABLE`
    //               | `SERVER_CONNECTION_INTERRUPTED`
    //               | `UNHANDLED_EXCEPTION`
    // 
    // @note These events have been added and are not part of the official
    //       aware bundle.
    private BroadcastReceiver syncEventListener = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            ReactApplicationContext reactContext = getReactApplicationContext();
            DeviceEventManagerModule.RCTDeviceEventEmitter eventEmitter = reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);

            switch (action) {
                case Aware.ACTION_AWARE_SYNC_DATA_STARTED: {
                    // Retrieve intent params.
                    String table = intent.getStringExtra("TABLE");
                    int rowCount = intent.getIntExtra("ROW_COUNT", -1);

                    // Convert params to js bridge format.
                    WritableMap params = Arguments.createMap();
                    params.putString("TABLE", table);
                    params.putInt("ROW_COUNT", rowCount);

                    // Emit js event.
                    eventEmitter.emit("Aware.ACTION_AWARE_SYNC_DATA_STARTED", params);

                    break;
                }
                case Aware.ACTION_AWARE_SYNC_DATA_BATCH_STARTED: {
                    // Retrieve intent params.
                    String table = intent.getStringExtra("TABLE");
                    int rowCount = intent.getIntExtra("ROW_COUNT", -1);
                    int lastRowUploaded = intent.getIntExtra("LAST_ROW_UPLOADED", -1);

                    // Convert params to js bridge format.
                    WritableMap params = Arguments.createMap();
                    params.putString("TABLE", table);
                    params.putInt("ROW_COUNT", rowCount);
                    params.putInt("LAST_ROW_UPLOADED", lastRowUploaded);

                    // Emit js event.
                    eventEmitter.emit("Aware.ACTION_AWARE_SYNC_DATA_BATCH_STARTED", params);

                    break;
                }
                case Aware.ACTION_AWARE_SYNC_DATA_FINISHED: {
                    // Retrieve intent params.
                    String table = intent.getStringExtra("TABLE");

                    // Convert params to js bridge format.
                    WritableMap params = Arguments.createMap();
                    params.putString("TABLE", table);

                    // Emit js event.
                    eventEmitter.emit("Aware.ACTION_AWARE_SYNC_DATA_FINISHED", params);

                    break;
                }
                case Aware.ACTION_AWARE_SYNC_DATA_FAILED: {
                    // Retrieve intent params.
                    String table = intent.getStringExtra("TABLE");
                    String error = intent.getStringExtra("ERROR");

                    // Convert params to js bridge format.
                    WritableMap params = Arguments.createMap();
                    params.putString("TABLE", table);
                    params.putString("ERROR", error);

                    // Emit js event.
                    eventEmitter.emit("Aware.ACTION_AWARE_SYNC_DATA_FAILED", params);

                    break;
                }
            }
        }
    };
}
