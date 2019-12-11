package org.pnplab.flux.aware;

import android.annotation.SuppressLint;
import android.app.Application;
import android.content.ActivityNotFoundException;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import android.text.TextUtils;
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

    /**
     * Checks if current package is not affected by Volte, Doze. This only
     * works for Android OS native battery savings, not custom ones (e.g., Sony
     * Stamina, etc). (cf. Aware source code).
     */
    @ReactMethod
    public void isBatteryOptimisationIgnored(Promise promise) {
        Context context = getReactApplicationContext().getApplicationContext();

        // Ignored by default on old android versions (didn't exist at the
        // time).
        boolean isBatteryOptimisationIgnored = true;
        // Check on new android version.
        if (Build.VERSION.SDK_INT > Build.VERSION_CODES.LOLLIPOP_MR1) {
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            // @todo set app package name dynamically in case of change.
            isBatteryOptimisationIgnored = pm.isIgnoringBatteryOptimizations("org.pnplab.flux");
        }

        promise.resolve(isBatteryOptimisationIgnored);
    }

    /**
     * This is required to bypass android service limitations in order for
     * - the tracking to be able to start back at phone reboot.
     * - the tracking to occur when the phone is sleeping.
     *
     * @pre Check if needed with isBatteryOptimisationIgnored.
     *
     * @warning due to android limitation, promise is resolved once the intent
     *     request has been triggered, thus the promise will *always* resolve
     *     too soon, before the privilege has been granted!
     */
    @ReactMethod
    public void ignoreBatteryOptimisation(Promise promise) {
        Context context = getReactApplicationContext().getApplicationContext();

        // Since we do not know how to retrieve feedback result from
        // intent-triggered setting change. We can't reliably know whether the
        // request is in-treatment or has been rejected except through polling
        // with timeout. It's thus required to allow user to do multiple
        // request before result even though it's unclean.
        //
        // // Check if battery optimisation is already ignored (for safety only,
        // // should have already been checked before this method call).
        //
        // // For old android versions, true by default.
        // boolean isBatteryOptimisationIgnored = true;
        //
        // // Check for more recent android version.
        // if (Build.VERSION.SDK_INT > Build.VERSION_CODES.LOLLIPOP_MR1) {
        //     PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        //     // @todo set app package name dynamically in case of change.
        //     isBatteryOptimisationIgnored = pm.isIgnoringBatteryOptimizations("org.pnplab.flux");
        // }
        //
        // // Log error if doze is actually already ignored.
        // if (isBatteryOptimisationIgnored) {
        //     Log.e("Flux", "attempt to ignore already ignored android battery optimisations.");
        //     promise.reject("attempt to ignore already ignored android battery optimisations.");
        //     return;
        // }

        // @warning google play refuses programmatically setting this except
        //    for specific use cases clinical uses aren't part of. thus this
        //    only works outside of google play. It is possible to launch the
        //    settings dynamically though but requires complex multi-step
        //    interaction (activate "disabling" sub setting in a list, select
        //    the app through all phone apps list, open specific app setting,
        //    disable optimisation, accept the popup authorization request and
        //    go back to app using phone's navigation button a few times). Code
        //    is available in aware source.
        //    cf. https://stackoverflow.com/questions/31154128/set-specific-app-to-ignore-optimization-by-code-in-android-m
        //    cf. https://developer.android.com/training/monitoring-device-state/doze-standby
        Log.w("Flux", "Doze optimization disabling is not allowed if app is pushed through google play.");

        try {
            // Trigger battery optimisation ignore request.
            Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);

            // Set package to which ignore doze.
            // @todo set app package name dynamically in case of change.
            intent.setData(Uri.parse("package:org.pnplab.flux"));

            // Fixes `Calling startActivity() from outside of an Activity
            // context requires the FLAG_ACTIVITY_NEW_TASK flag.` on Android 9+.
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

            // Toggle permission request popup.
            context.startActivity(intent);

            // Resolve promise once done.
            // @warning This should not work as intent is triggered and
            //     executed by android OS asynchronously. We should poll for
            //     change instead.
            promise.resolve(null);
        } catch (ActivityNotFoundException e) {
            // Reject promise in case of failure.
            promise.reject("failed to request battery optimizations.");

            // Log issue.
            Log.e("Flux", "failed to request battery optimizations.");
            e.printStackTrace();
        }
    }

    /**
     *  @warning this checks for Applications class (the aware accessibility
     *      service) only.
     */
    @ReactMethod
    public void isAccessibilityServiceEnabled(Promise promise) {
        Context context = getReactApplicationContext().getApplicationContext();

        // Check global accessibility system is enabled.
        int globalAccessibilitySystemEnabled = 0;
        try {
            // Check global accessibility system is enabled.
            globalAccessibilitySystemEnabled = Settings.Secure.getInt(context.getContentResolver(), android.provider.Settings.Secure.ACCESSIBILITY_ENABLED);
        } catch (Settings.SettingNotFoundException e) {
            // Accessibility system not found.
            Log.e("Flux", "Error finding accessibility setting, default accessibility to not found: " + e.getMessage());
        }

        // Check our own accessibility service is enabled if global system is
        // enabled.
        boolean isAccessibilityServiceEnabled = false;
        if (globalAccessibilitySystemEnabled == 0) {
            // ...global accessibility system is disabled.
            // keep isAccessibilityServiceEnabled to false.
        }
        else if (globalAccessibilitySystemEnabled == 1) {
            // @warning this checks for Applications class (the aware
            //     accessibility service) only.
            final String accessibilityService = context.getPackageName() + "/" + Applications.class.getCanonicalName();
            TextUtils.SimpleStringSplitter mStringColonSplitter = new TextUtils.SimpleStringSplitter(':');

            String settingValue = Settings.Secure.getString(context.getApplicationContext().getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
            if (settingValue != null) {
                mStringColonSplitter.setString(settingValue);
                // Compare all accessibility service names with our.
                while (mStringColonSplitter.hasNext()) {
                    String currentAccessibilityService = mStringColonSplitter.next();

                    if (currentAccessibilityService.equalsIgnoreCase(accessibilityService)) {
                        // Our accessibility service is enabled!
                        isAccessibilityServiceEnabled = true;

                        // ...no need to check further through.
                        // Break the loop.
                        break;
                    }
                }
            }
        }

        // Return the result.
        promise.resolve(isAccessibilityServiceEnabled);

    }
    @ReactMethod
    public void openSystemAccessibilitySettings() {
        Context context = getReactApplicationContext().getApplicationContext();

        // ...there is no way to dynamically set accessibility setting (except
        // for system app, which must be preinstalled android rom apps).
        // cf. https://stackoverflow.com/questions/10061154/how-to-programmatically-enable-disable-accessibility-service-in-android

        // Open accessibility settings.
        Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);

        // Fixes `Calling startActivity() from outside of an Activity context
        // requires the FLAG_ACTIVITY_NEW_TASK flag.` on Android 9+.
        // FLAG_ACTIVITY_CLEAR_TOP keeps new activity in same navigation
        // history so user can go back easily.
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        // Toggle accessibility system settings.
        context.startActivity(intent);
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
