package org.pnplab.flux.notification;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class ReactModule extends ReactContextBaseJavaModule {

    // Default constructor.
    public ReactModule(@NonNull ReactApplicationContext reactContext) {
        this(reactContext, new DailyTasksNotificationPolicy(), new WeeklyTasksNotificationPolicy());
    }

    // Constructor with mockable dependencies for testing.
    public ReactModule(ReactApplicationContext reactApplicationContext,
                       DailyTasksNotificationPolicy dailyTasksNotificationPolicy,
                       WeeklyTasksNotificationPolicy weeklyTasksNotificationPolicy) {
        super(reactApplicationContext);
    }

    @NonNull
    @Override
    public String getName() {
        return "Notification";
    }

    @ReactMethod
    public void scheduleNotificationForStudyTaskModality(String studyModality) {
        // Assess parameters.
        if (!studyModality.equals("daily") && !studyModality.equals("weekly")) {
            throw new Error("studyModality should either be daily or weekly");
        }
    }

    @ReactMethod
    public void rescheduleNotificationForStudyTaskModality(String studyModality) {
        // Assess parameters.
        if (!studyModality.equals("daily") && !studyModality.equals("weekly")) {
            throw new Error("studyModality should either be daily or weekly");
        }
    }
}
