package org.pnplab.flux.notifications;

import android.os.RemoteException;

import androidx.test.uiautomator.UiObjectNotFoundException;

import org.junit.After;
import org.junit.BeforeClass;
import org.junit.Ignore;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TestRule;
import org.junit.rules.TestWatcher;
import org.junit.runner.Description;

public class TaskReminderForDailyTaskStudiesSpec {
    private static TaskReminderTestHelper taskReminderTestHelper;

    @Rule
    public TestRule watcher = new TestWatcher() {
       protected void starting(Description description) {
       System.out.println("Starting test: " + description.getMethodName());
       }
    };

    @BeforeClass
    public static void beforeAll() throws RemoteException, UiObjectNotFoundException {
        // Setup test helper for generic task policy reminders.
        taskReminderTestHelper = new TaskReminderTestHelper(5000);

        // Adds a few logs with solution of common issue when running test.
        taskReminderTestHelper.notifyMustServeJs();
        taskReminderTestHelper.notifyFirstTestRunFailsBecauseJsServeIsSlow();
        taskReminderTestHelper.notifyRandomCrashCausedByThreadSleep();

        // Ensure pristine state for test.
        // taskReminderTestHelper.restoreAutomaticSystemDateTimeSettings();
    }

    @After
    public void afterEach() throws RemoteException, UiObjectNotFoundException {
        // Go back to automatic date time settings (hopefully it was the previous setting).
        // @warning assuming previous system datetime settings where the automatic ones.
        taskReminderTestHelper.restoreAutomaticSystemDateTimeSettings();

        // Clear notifications
        taskReminderTestHelper.clearAllNotifications();
    }

    @Test
    public void should_Notify_On_Third_Day_After_Task_Missed_Two_Days_In_A_Row_When_App_Is_In_Background() throws RemoteException, UiObjectNotFoundException, InterruptedException {
        // Set phone's current datetime at 21:30. Tests are available from 19:00 till 22:00. We
        // want to test the edge case were it's a bit less than two days in hours that happened
        // between the missed tests and the notification, but still two days apart. This can happen
        // because the timing window for task is 3 hours long, thus the condition to receive a
        // notification actually is 2days-3h without survey task done.
        taskReminderTestHelper.setSystemDateTime("2019-10-21 21:00");

        // Open app in test scenario mode. This bypasses the onboarding and goes straight to the
        // Home section.
        taskReminderTestHelper.launchTestScenario();

        // ...do not do the task for today

        // Set phone's current datetime 2 days later just before 18h in order
        // to trigger the notification.
        // @note Seems we could just jump after 18:00 to have the notif popping
        // up automatically (android seems to work this way when you change time).
        taskReminderTestHelper.setSystemDateTime("2019-10-24 17:59");

        // @todo assert notification not present already.

        // Check notification heads up is appearing. Wait for 10 minutes.
        // @warning Even with `exact: true` parameter for react-native
        // notification, notification doesn't appear at exact time and most
        // common use case found was more than 3 minutes of wait.
        taskReminderTestHelper.assertNotificationHeadsup(
            "Flux",
            "Merci de compléter le questionnaire et la tâche entre 18h et 23.",
            60000 * 10
        );

        // Check notification is appearing. Wait for 10 minutes.
        taskReminderTestHelper.assertNotification(
            "Flux",
            "Merci de compléter le questionnaire et la tâche entre 18h et 23.",
            60000 * 10
        );

        // Wait a bit till react native does it's stuff and load the window. Indeed, Flux window
        // is automatically sent to background for some reason after the test.
        // @warning `Thread.sleep` seem to crash the app with `No such thread for suspend` at first
        //     app launch after emulator opening.
        Thread.sleep(1000000);
    }

    @Test
    public void should_Notify_On_Third_Day_After_Task_Missed_Two_Days_In_A_Row_When_App_Is_In_Foreground() throws RemoteException, UiObjectNotFoundException, InterruptedException {
        // Set phone's current datetime at 21:30. Tests are available from 19:00 till 22:00. We
        // want to test the edge case were it's a bit less than two days in hours that happened
        // between the missed tests and the notification, but still two days apart. This can happen
        // because the timing window for task is 3 hours long, thus the condition to receive a
        // notification actually is 2days-3h without survey task done.
        taskReminderTestHelper.setSystemDateTime("2019-10-21 21:00");

        // Open app in test scenario mode. This bypasses the onboarding and goes straight to the
        // Home section.
        taskReminderTestHelper.launchTestScenario();

        // ...do not do the task for today

        // Set phone's current datetime 2 days later just before 18h in order
        // to trigger the notification.
        // @note Seems we could just jump after 18:00 to have the notif popping
        // up automatically (android seems to work this way when you change time).
        taskReminderTestHelper.setSystemDateTime("2019-10-24 17:59");

        // @todo assert notification not present already.

        // Put back the app in foreground.
        taskReminderTestHelper.openAppInForeground();

        // Check notification heads up is appearing. Wait for 10 minutes.
        // @warning Even with `exact: true` parameter for react-native
        // notification, notification doesn't appear at exact time and most
        // common use case found was more than 3 minutes of wait.
        taskReminderTestHelper.assertNotificationHeadsup(
            "Flux",
            "Merci de compléter le questionnaire et la tâche entre 18h et 22h.",
            60000 * 10
        );

        // Check notification is appearing. Wait for 10 minutes.
        taskReminderTestHelper.assertNotification(
            "Flux",
            "Merci de compléter le questionnaire et la tâche entre 18h et 22h.",
            60000 * 10
        );

        // Wait a bit till react native does it's stuff and load the window. Indeed, Flux window
        // is automatically sent to background for some reason after the test.
        // @warning `Thread.sleep` seem to crash the app with `No such thread for suspend` at first
        //     app launch after emulator opening.
        Thread.sleep(1000000);
    }

    @Test
    @Ignore("no way to restart phone found yet")
    public void no_Task_Done_In_Two_Days_And_Phone_Has_Rebooted_Since() throws RemoteException, UiObjectNotFoundException, InterruptedException {

    }

    @Test
    @Ignore("didn't develop way to assert a notification is not present yet")
    public void should_Not_Display_Rescheduled_Notification_At_Previous_Moment() {

    }
}
