package org.pnplab.flux.aware;

import android.annotation.SuppressLint;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.util.Log;

import com.aware.Applications;
import com.aware.Aware;
import com.aware.Aware_Preferences;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import org.jetbrains.annotations.NotNull;
import org.pnplab.flux.BuildConfig;

public class ReactModule extends ReactContextBaseJavaModule {

    public ReactModule(ReactApplicationContext reactContext) {
        super(reactContext);

        Context context = reactContext.getApplicationContext();

        // Listen to aware sync events.
        IntentFilter filter = new IntentFilter();
        filter.addAction(Aware.ACTION_AWARE_SYNC_DATA_STARTED);
        filter.addAction(Aware.ACTION_AWARE_SYNC_DATA_BATCH_STARTED);
        filter.addAction(Aware.ACTION_AWARE_SYNC_DATA_FINISHED);
        filter.addAction(Aware.ACTION_AWARE_SYNC_DATA_FAILED);
        context.registerReceiver(this.syncEventListener, filter);
    }

    @Override
    public void onCatalystInstanceDestroy() {
        Context context = getReactApplicationContext().getApplicationContext();

        // Unlisten aware sync events.
        context.unregisterReceiver(this.syncEventListener);
    }

    @NotNull
    @Override
    public String getName() {
        return "AwareManager";
    }

    @ReactMethod
    public void hasStudyBeenJoined(Promise promise) {
        if (!Aware.IS_CORE_RUNNING) {
            promise.resolve(false);
        }
        else {
            // @warning doesn't tell if services are active.
            Context context = getReactApplicationContext().getApplicationContext();
            // @warning seems to have false positive -- maybe due to corrupt db
            // (by looking at code, there is unchecked error use-cases) ?
            // unlikely though.
            boolean hasStudyBeenJoined = Aware.isStudy(context);
            promise.resolve(hasStudyBeenJoined);
        }
    }

    @SuppressLint("ApplySharedPref")
    @ReactMethod
    public void startAware(String deviceId) {
        Context context = getReactApplicationContext().getApplicationContext();

        // Log aware entries.
        Aware.DEBUG = BuildConfig.DEBUG;
        Aware.setSetting(context, Aware_Preferences.DEBUG_FLAG, BuildConfig.DEBUG);

        // Start aware.
        if (!Aware.IS_CORE_RUNNING) {
            Intent aware = new Intent(context, Aware.class);
            context.startService(aware);
        }

        // Ask user to enable accessibility service and ignore battery optimisation.
        Applications.isAccessibilityServiceActive(context);
        Aware.isBatteryOptimizationIgnored(context, context.getPackageName());

        // @warning AWARE device_id is random UUID which makes it untraceable. We need to specify a
        //     static device_id. We use manually mapped participant id.
        Aware.setSetting(context, Aware_Preferences.DEVICE_ID, deviceId);

        // Start Aware (mainly as this starts scheduler and thus ask permission requests which is
        // required before joining study)
        // @warning However, atm, aware permission request appears to be buggy when used with
        //      react-native! permission should be requested before #startAware is called!).
        Aware.startAWARE(context);
    }

    @ReactMethod
    public void stopAware() {
        Context context = getReactApplicationContext().getApplicationContext();

        Aware.stopAWARE(context);
    }

    @ReactMethod
    public void joinStudy(String studyUrl, Promise promise) {
        Context context = getReactApplicationContext().getApplicationContext();

        // @warning promise is never rejected in case of failure as aware
        // doesn't have propper callback mechanism.

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
    }

    @ReactMethod
    public void syncData() {
        Context context = getReactApplicationContext().getApplicationContext();

        Log.v("pnplab::AwareManager", "#syncData - broadcasting Aware.ACTION_AWARE_SYNC_DATA");

        // Ask aware to sync data.
        Intent sync = new Intent(Aware.ACTION_AWARE_SYNC_DATA);
        context.sendBroadcast(sync);
    }

    @ReactMethod
    public void getDeviceId(Promise promise) {
        Context context = getReactApplicationContext().getApplicationContext();
        String deviceId = Aware.getSetting(context, Aware_Preferences.DEVICE_ID);

        promise.resolve(deviceId);
    }
    
    @ReactMethod    
    public void enableAutomaticSync() {
        Context context = getReactApplicationContext().getApplicationContext();

        Aware.setSetting(context, Aware_Preferences.STATUS_WEBSERVICE, "true");
    }
    @ReactMethod
    public void disableAutomaticSync() {
        Context context = getReactApplicationContext().getApplicationContext();

        Aware.setSetting(context, Aware_Preferences.STATUS_WEBSERVICE, "false");
    }    
    @ReactMethod
    public void enableMandatoryWifiForSync() {
        Context context = getReactApplicationContext().getApplicationContext();

        Aware.setSetting(context, Aware_Preferences.WEBSERVICE_WIFI_ONLY, "true");
    }
    @ReactMethod
    public void disableMandatoryWifiForSync() {
        Context context = getReactApplicationContext().getApplicationContext();

        Aware.setSetting(context, Aware_Preferences.WEBSERVICE_WIFI_ONLY, "false");
    }
    @ReactMethod
    public void enableMandatoryBatteryForSync() {
        Context context = getReactApplicationContext().getApplicationContext();

        Aware.setSetting(context, Aware_Preferences.WEBSERVICE_CHARGING, "true");
    }
    @ReactMethod
    public void disableMandatoryBatteryForSync() {
        Context context = getReactApplicationContext().getApplicationContext();

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
