package org.pnplab.flux;

import android.content.Intent;
import android.util.Log;

import com.aware.Applications;
import com.aware.Aware;
import com.aware.Aware_Preferences;
import com.aware.utils.DatabaseHelper;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

import org.pnplab.flux.awareplugin.survey.Survey;

public class AwareManagerModule extends ReactContextBaseJavaModule {

    private Survey _survey;

    public AwareManagerModule(ReactApplicationContext reactContext) {
        super(reactContext);
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
        Aware.startAWARE(context);

        // Create aware plugin interfaces (but don't start them until the study has been joined)
        _survey = new Survey();
    }

    @ReactMethod
    public void stopAware() {
        ReactApplicationContext context = getReactApplicationContext();

        Aware.stopAWARE(context);
    }

    @ReactMethod
    public void joinStudy(String studyUrl) {
        ReactApplicationContext context = getReactApplicationContext();

        Aware.joinStudy(context, studyUrl);
        // Aware.joinStudy(context, "https://api.awareframework.com/index.php/webservice/index/2310/SYd7YMg0Sgnz");

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

        Intent sync = new Intent(Aware.ACTION_AWARE_SYNC_DATA);
        context.sendBroadcast(sync);
    }

    @ReactMethod
    public void getDeviceId(Promise promise) {
        ReactApplicationContext context = getReactApplicationContext();
        String deviceId = Aware.getSetting(context, Aware_Preferences.DEVICE_ID);

        promise.resolve(deviceId);
    }
}
