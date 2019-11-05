package org.pnplab.flux.notification;

import android.content.Context;
import android.os.Build;

import androidx.test.core.app.ApplicationProvider;
import androidx.test.ext.junit.runners.AndroidJUnit4;

import com.facebook.react.bridge.ReactApplicationContext;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.pnplab.flux.TestApplication;
import org.robolectric.annotation.Config;

import static com.google.common.truth.ExpectFailure.assertThat;
import static org.mockito.Mockito.mock;

@RunWith(AndroidJUnit4.class)
@Config(
    sdk = Build.VERSION_CODES.O_MR1,
    // Setup custom Application that doesn't load binaries incompatible with
    // Robolectric.
    application = TestApplication.class
)
public class ReactModuleSpec {

    private ReactModule reactModule;
    private ReactApplicationContext reactApplicationContext;

    @Before
    public void beforeEach() {
        // Setup react module.

        // Retrieve application context.
        Context applicationContext = ApplicationProvider.getApplicationContext();

        // Recreate ReactApplicationContext which ReactModule depends upon.
        // ReactApplicationContext sole purpose as documented in its source
        // code is to preserve type integrity of ApplicationContext over
        // Context (which android Context obviously does not). This should be
        // safe thus. See my post here: `https://stackoverflow.com/a/58783735/939741`.
        reactApplicationContext = new ReactApplicationContext(applicationContext);
    }

    @Test
    public void it_Should_Schedule_Notification_In_2_Days_For_Daily_Tasks() {
        // Given current time set.

        // Given the react module and mocked dependencies.
        DailyTasksNotificationPolicy dailyTasksNotificationPolicy = mock(DailyTasksNotificationPolicy.class);
        WeeklyTasksNotificationPolicy weeklyTasksNotificationPolicy = mock(WeeklyTasksNotificationPolicy.class);
        reactModule = new ReactModule(reactApplicationContext, dailyTasksNotificationPolicy, weeklyTasksNotificationPolicy);
        
        // When the task is scheduled.
        reactModule.scheduleNotificationForStudyTaskModality("daily");

        // Then
        // when(notificationReactModule).thenCallRealMethod();
    }

    @Test
    public void it_Should_Reschedule_Notification_In_2_Days_For_Daily_Tasks() {

    }

    @Test
    public void it_Should_Schedule_Notification_In_1_Week_For_Daily_Tasks() {

    }

    @Test
    public void it_Should_Reschedule_Notification_In_1_Week_For_Daily_Tasks() {

    }

}
