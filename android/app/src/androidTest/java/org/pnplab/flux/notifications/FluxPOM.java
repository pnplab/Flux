package org.pnplab.flux.notifications;

import android.content.Context;
import android.content.Intent;
import android.os.RemoteException;

import androidx.test.core.app.ApplicationProvider;
import androidx.test.uiautomator.By;
import androidx.test.uiautomator.UiDevice;
import androidx.test.uiautomator.UiObject;
import androidx.test.uiautomator.UiObjectNotFoundException;
import androidx.test.uiautomator.UiSelector;
import androidx.test.uiautomator.Until;

public class FluxPOM {
    private final UiDevice device;
    private final long timeout;

    public FluxPOM(UiDevice device, long timeout) {
        this.device = device;
        this.timeout = timeout;
    }

    public void launchApp() {
        // Set app package name.
        final String APP_PACKAGE_NAME = "org.pnplab.flux";

        // Start from the home screen.
        device.pressHome();

        // Wait for launcher.
        final String launcherPackage = device.getLauncherPackageName();
        assert(launcherPackage != null);
        device.wait(Until.hasObject(By.pkg(launcherPackage).depth(0)), timeout);

        // Get context (of Home app ?).
        Context context = ApplicationProvider.getApplicationContext();

        // Launch App.
        final Intent intent = context.getPackageManager().getLaunchIntentForPackage(APP_PACKAGE_NAME);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK);
        // intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);

        // Wait for the app to appear.
        device.wait(Until.hasObject(By.pkg(APP_PACKAGE_NAME).depth(0)), timeout);
    }

    /**
     * We should launch on <Auth> component. We sets up a special password made to bypass the
     * onboarding process, ignore aware and go to <Home> component.
     *
     * @pre Must be on <Auth> part of the app (in onboarding).
     *
     * @throws UiObjectNotFoundException
     */
    public void openTestScenario() throws UiObjectNotFoundException {
        // Wait for react-native to load initial view.
        device.wait(Until.hasObject(By.desc("auth")), timeout);

        // Set a random deviceId.
        UiObject deviceIdField = new UiObject(new UiSelector().description("auth-deviceid"));
        deviceIdField.setText("testDeviceId");

        // Set up the special password to enter testing mode.
        UiObject passwordField = new UiObject(new UiSelector().description("auth-password"));
        passwordField.setText("371olh");

        // Validate it all.
        UiObject submitButton =  new UiObject(new UiSelector().description("auth-submit"));
        submitButton.click();

        // ...we should now be in <Home> component.
    }

    public void quitApp() throws RemoteException, UiObjectNotFoundException {
        // Close settings.
        device.pressRecentApps();
        UiObject app = new UiObject(new UiSelector().description("Flux"));
        app.swipeUp(100);

        // Return to home screen (quit recent app panel).
        device.pressHome();

    }
}
