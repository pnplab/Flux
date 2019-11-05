package org.pnplab.flux.notifications;

import android.content.Context;
import android.os.RemoteException;
import android.util.Log;

import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.uiautomator.UiDevice;
import androidx.test.uiautomator.UiObjectNotFoundException;

import org.pnplab.flux.R;

// Those notifications are setup in javascript, but we test them with UIAutomator. Check the
// following pasted comments from js tests.
//
// > The only way to test notification integration effectively is through java
// > UIAutomator. cf. `https://alexzh.com/2018/06/16/guide-testing-android-notifications/`.
// > It is however difficult to change the time of the device programatically in
// > order to set up the context for notification to happen cf.
// > `https://stackoverflow.com/questions/17939572/how-to-set-time-to-device-programmatically`.
// > It's possible outside tests through adb (and inside tests w/ appium
// > cf. `http://appium.io/docs/en/writing-running-appium/android/android-shell/`).
// > It seems possible to do it in tests through ProcessExecutor class but that seems
// > unsafe `https://www.swtestacademy.com/adb-commands-java-device-manipulation/`
// > and probably impossible with unrooted devices cf.
// > `https://stackoverflow.com/questions/6584772/is-possible-to-set-system-datetime-from-my-android-app`.
// > The only option that stands left is to set time through settings and use
// > UIAutomator2 to do so automatically. Appium can't be used as it doesn't
// > provide the underlying UIAutomator API (even though he uses it) to tests the
// > notifications (as they appears outside of the app).
// > `https://stackoverflow.com/questions/9434239/set-androids-date-time-programmatically/9434344`
// > can help to launch the correct setting tab.
//
// > Thus can either we test the mocked notification API and hope for the best
// > (as manual testing requires to change system times and stuff so wont do) or
// > do these as e2e tests in Java.
//
// The react-native firebase v5 documentation over local scheduled notifications is a bit hard to
// grasp as the matter is complex (v6 is extremely very promising:
// https://github.com/invertase/react-native-firebase/issues/2566) and thus manual testing is
// required to make sure everything works fine. Better to automatise this.
//
// Inspired by tutorial here: `https://developer.android.com/training/testing/ui-testing/uiautomator-testing`.
// @SdkSuppress ensures that tests will only run on devices with Android 4.3 (API level 18) or higher, as required by the UI Automator framework.
//
// @note
// Typing `$ uiautomatorviewer` in your terminal opens the app that provides the view hierarchy
// info of the emulator's currently displayed app. Useful to define the UiAutomator selectors.
// @warning
// In case of `Error while obtaining UI hierarchy XML file: com.android.ddmlib.SyncException:
// Remote object doesn't exist!` error inside the viewer. Restarting emulator / viewer wont do!
// Instead, you have to first restart adb server cf. `$ adb kill-server; adb start-server`, and
// then only restart `uiautomatorviewer`.
public class TaskReminderTestHelper {

    private UiDevice device;
    private long timeout;

    public TaskReminderTestHelper(long timeout) {
        this.timeout = timeout;

        // Initialize UiDevice instance.
        device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());
    }

    public void notifyMustServeJs() {
        // Warn developer to use served version of the js part of the project.
        Log.i("UiTest", "Instrumentation testing.");
        Log.i("UiTest", "@warning make sure you're serving the project to see the development javascript version.");
        Log.i("UiTest", "         `yarn backend & ; yarn backend:ngrok & ; yarn androidstudio & ; yarn serve`");
        Log.i("UiTest", "         if you don't, you wont be warned but will be served the lastly built js version!");
    }

    public void notifyRandomCrashCausedByThreadSleep() {
        // Warn developer about random crash happening at initial launch when using `Thread.wait()`
        // somewhere in the test.
        Log.i("UiTest", "@warning tests sometimes crash at initial launch with `No such thread for suspend` error due to `Thread.sleep()` usage. Unfortunately, there is no exact alternative.");
    }

    public void setSystemDateTime(String datetime) throws UiObjectNotFoundException, RemoteException {
        // Set up system date time settings page object model.
        DateTimeSettingsPOM dateTimeSettingsPOM = new DateTimeSettingsPOM(device, timeout);

        // Open system date & time prefs.
        dateTimeSettingsPOM.openSettings();

        // Set date & time manually.
        dateTimeSettingsPOM.enableManualDateTime();
        dateTimeSettingsPOM.setIsoDateTime(datetime);

        // Assert change as occured.
        String isoDateTime = dateTimeSettingsPOM.readIsoDateTime();
        assert(isoDateTime.equals(datetime));

        // Close setting panel.
        dateTimeSettingsPOM.closeSettingsAndReturnToHome();
    }

    public void launchTestScenario() throws UiObjectNotFoundException {
        // Set up Flux page object model.
        FluxPOM fluxPOM = new FluxPOM(device, timeout);

        // Open app in test scenario mode. This bypasses the onboarding and goes straight to the
        // Home section.
        fluxPOM.launchApp();
        fluxPOM.openTestScenario();
    }

    public void assertNotification(String title, String content) {
        // Set up notification page object model.
        // 1. Get app name.
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        String appName = context.getString(R.string.app_name);
        // 2. Instantiate notification POM.
        NotificationPOM notificationPOM = new NotificationPOM(device, timeout, appName);

        // Check notification is appearing.
        notificationPOM.openNotificationPanel();
        notificationPOM.assertNotification(title, content);

    }

    public void restoreAutomaticSystemDateTimeSettings() throws UiObjectNotFoundException, RemoteException {
        // Set up system date time settings page object model.
        DateTimeSettingsPOM dateTimeSettingsPOM = new DateTimeSettingsPOM(device, timeout);

        // Open system date & time prefs.
        dateTimeSettingsPOM.openSettings();

        // Set date & time automatically.
        dateTimeSettingsPOM.disableManualDateTime();

        // Close settings.
        dateTimeSettingsPOM.closeSettingsAndReturnToHome();
    }
}
