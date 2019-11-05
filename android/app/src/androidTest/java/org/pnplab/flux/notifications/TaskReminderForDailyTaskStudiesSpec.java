package org.pnplab.flux.notifications;

import android.os.RemoteException;

import androidx.test.uiautomator.UiObjectNotFoundException;

import org.junit.After;
import org.junit.BeforeClass;
import org.junit.Ignore;
import org.junit.Test;

public class TaskReminderForDailyTaskStudiesSpec {
    private static TaskReminderTestHelper taskReminderTestHelper;

    @BeforeClass
    public static void notice() {
        // Setup test helper for generic task policy reminders.
        taskReminderTestHelper = new TaskReminderTestHelper(5000);

        // Adds a few logs with solution of common issue when running test.
        taskReminderTestHelper.notifyMustServeJs();
        taskReminderTestHelper.notifyRandomCrashCausedByThreadSleep();
    }

    @After
    public void restoreAutomaticSystemDateTimeSettings() throws RemoteException, UiObjectNotFoundException {
        // Go back to automatic date time settings (hopefully it was the previous setting).
        // @warning assuming previous system datetime settings where the automatic ones.
        taskReminderTestHelper.restoreAutomaticSystemDateTimeSettings();
    }

    @Test
    public void noTaskDoneInTwoDays() throws RemoteException, UiObjectNotFoundException, InterruptedException {
        // Set phone's current datetime at 21:30. Tests are available from 19:00 till 22:00. We
        // want to test the edge case were it's a bit less than two days in hours that happened
        // between the missed tests and the notification, but still two days apart. This can happen
        // because the timing window for task is 3 hours long, thus the condition to receive a
        // notification actually is 2days-3h without survey task done.
        taskReminderTestHelper.setSystemDateTime("2019-10-21 21:30");

        // Open app in test scenario mode. This bypasses the onboarding and goes straight to the
        // Home section.
        taskReminderTestHelper.launchTestScenario();

        // ...do not do the task for today

        // Set phone's current datetime 2 days later in order to trigger the notification.
        taskReminderTestHelper.setSystemDateTime("2019-10-23 18:59");

        // Wait for 2 minute.
        // Wait the notification to pop up.
        // @todo replace with active waiting -- android has the end word on these kind of stuff &
        //    sleep may crash the app.
        Thread.sleep(180000);

        // Check notification is appearing.
        taskReminderTestHelper.assertNotification("Flux", "La nouvelle tâche est disponible.");

        // Wait a bit till react native does it's stuff and load the window. Indeed, Flux window
        // is automatically sent to background for some reason after the test.
        // @warning `Thread.sleep` seem to crash the app with `No such thread for suspend` at first
        //     app launch after emulator opening.
        Thread.sleep(100000);
    }

    @Test
    @Ignore("no way to restart phone found yet")
    public void noTaskDoneInTwoDaysPhoneRestarted() throws RemoteException, UiObjectNotFoundException, InterruptedException {

    }

    @Test
    @Ignore("didn't develop way to assert a notification is not present yet")
    public void taskBeenDoneBeforeTwoDays() {

    }
}
