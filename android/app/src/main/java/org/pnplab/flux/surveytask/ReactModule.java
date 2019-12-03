package org.pnplab.flux.surveytask;

import com.aware.Aware;
import com.aware.Aware_Preferences;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

import org.pnplab.flux.surveytask.model.SurveyDataRepository;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import javax.annotation.Nonnull;

@SuppressWarnings("FieldCanBeLocal")
public class ReactModule extends ReactContextBaseJavaModule {

    private final SurveyDataRepository _surveyDataRepository;

    ReactModule(@Nonnull ReactApplicationContext reactContext) {
        super(reactContext);

        _surveyDataRepository = new SurveyDataRepository(reactContext.getContentResolver());
    }

    @Nonnull
    @Override
    public String getName() {
        return "SurveyTask";
    }

    @ReactMethod
    public void storeSurveyData(String timestamp64bInString, ReadableMap values) {
        // Retrieve device id from aware.
        String deviceId = Aware.getSetting(getReactApplicationContext(), Aware_Preferences.DEVICE_ID);

        // Generate random id for form.
        String formId = UUID.randomUUID().toString();

        // We use long for timestamp as it's defined in milisecond (> 2^32),
        // both in default javascript `new date().getTime()` result & in aware.
        // Following aware's convention is mandatory as it's used to verify in
        // syncing as not been done already. @ReactMethod's bridge doesn't
        // support long but only int so we first have to convert it to string
        // then 64b long.
        // @warning long to int conversion seems implicit in java (no error
        //     thrown).
        long timestamp = Long.parseLong(timestamp64bInString);

        // Convert react-native map into java map.
        Map<String, Object> valuesAsMap = values.toHashMap();
        Map<String, Double> valuesAsCastedMap = new HashMap<String, Double>();
        for (String key : valuesAsMap.keySet()) {
            valuesAsCastedMap.put(key, (Double) valuesAsMap.get(key));
        }

        _surveyDataRepository.insertSurveyData(deviceId, formId, timestamp, valuesAsCastedMap);
    }
}
