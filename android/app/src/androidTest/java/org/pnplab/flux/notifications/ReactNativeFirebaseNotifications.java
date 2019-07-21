package org.pnplab.flux.notifications;

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

import android.os.RemoteException;

import androidx.test.filters.SdkSuppress;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.runner.AndroidJUnit4;
import androidx.test.uiautomator.UiDevice;
import androidx.test.uiautomator.UiObjectNotFoundException;

import org.junit.BeforeClass;
import org.junit.Test;
import org.junit.runner.RunWith;

import static android.os.SystemClock.sleep;

// Inspired by tutorial here: `https://developer.android.com/training/testing/ui-testing/uiautomator-testing`.
// @SdkSuppress ensures that tests will only run on devices with Android 4.3 (API level 18) or higher, as required by the UI Automator framework.
//
// @note
// Typing `$ uiautomatorviewer` in your terminal opens the app that provides the view hierarchy
// info of the emulator's currently displayed app. Useful to define the UiAutomator selectors.
//
//
@RunWith(AndroidJUnit4.class)
@SdkSuppress(minSdkVersion = 18)
public class ReactNativeFirebaseNotifications {

    private static final String APP_PACKAGE_NAME = "org.pnplab.flux";
    private static final int APP_LAUNCH_TIMEOUT = 5000;
    private static UiDevice device;

    @BeforeClass
    public static void setupDevice() throws UiObjectNotFoundException, RemoteException {
        // Initialize UiDevice instance.
        device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());
    }

    //@BeforeClass
    public static void setupManualDateTime() throws UiObjectNotFoundException, RemoteException {
        // Set phone's current datetime manually.
        DateTimeSettingsPOM dateTimeSettingsPOM = new DateTimeSettingsPOM(device, APP_LAUNCH_TIMEOUT);
        dateTimeSettingsPOM.openSettings();
        dateTimeSettingsPOM.enableManualDateTime();
        dateTimeSettingsPOM.setIsoDateTime("2018-02-21 15:41");
        String isoDateTime = dateTimeSettingsPOM.readIsoDateTime();
        assert(isoDateTime.equals("2018-02-21 15:41"));
        dateTimeSettingsPOM.closeSettings();
    }

    @Test
    public void testFlux() throws InterruptedException {
        FluxPOM fluxPOM = new FluxPOM(device, APP_LAUNCH_TIMEOUT);
        fluxPOM.launchApp();


        // Wait a bit till react native does it's stuff and load the window. Indeed, Flux window
        // is automatically sent to background for some reason after the test.
        Thread.sleep(10000);

        assert(true);
    }

    //@AfterClass
    public static void resetAutomaticDateTime() throws UiObjectNotFoundException, RemoteException {
        // Reset phone's current datetime to automatic one.
        DateTimeSettingsPOM dateTimeSettingsPOM = new DateTimeSettingsPOM(device, APP_LAUNCH_TIMEOUT);
        dateTimeSettingsPOM.openSettings();
        dateTimeSettingsPOM.disableManualDateTime();
        String isoDateTime = dateTimeSettingsPOM.readIsoDateTime();
        assert(!isoDateTime.equals("2018-02-21 15:41"));
        dateTimeSettingsPOM.closeSettings();
    }

    /*
    @Before
    public void startMainActivityFromHomeScreen() {
        // Initialize UiDevice instance
        device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());

        // Start from the home screen
        device.pressHome();

        // Wait for launcher
        final String launcherPackage = device.getLauncherPackageName();
        assert(launcherPackage != null);
        device.wait(Until.hasObject(By.pkg(launcherPackage).depth(0)), APP_LAUNCH_TIMEOUT);

        // Launch the app
        Context context = ApplicationProvider.getApplicationContext();
        final Intent intent = context.getPackageManager().getLaunchIntentForPackage(APP_PACKAGE_NAME);
        // Clear out any previous instances
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK);
        context.startActivity(intent);

        // Wait for the app to appear
        device.wait(Until.hasObject(By.pkg(APP_PACKAGE_NAME).depth(0)), APP_LAUNCH_TIMEOUT);
    }
    */

}
