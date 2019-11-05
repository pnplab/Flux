package org.pnplab.flux.notifications;

import androidx.test.uiautomator.By;
import androidx.test.uiautomator.UiDevice;
import androidx.test.uiautomator.UiObject2;
import androidx.test.uiautomator.Until;

import org.pnplab.flux.R;


// Inspired by `https://alexzh.com/2018/06/16/guide-testing-android-notifications/`.
public class NotificationPOM {

    private final UiDevice device;
    private final long timeout;

    private final String appName;

    public NotificationPOM(UiDevice device, long timeout, String appName) {
        this.device = device;
        this.timeout = timeout;
        this.appName = appName;
    }

    public void openNotificationPanel() {
        // Open notification window.
        device.openNotification();
    }

    // @todo better wait fn
    // @todo move enhanced wait fn to openNotificationPanel
    public void clearAllNotifications() {
        // Wait till app name appears.
        device.wait(Until.hasObject(By.textStartsWith(appName)), timeout);

        // Clear all notifications.
        UiObject2 clearAll = device.findObject(By.res("com.android.systemui:id/dismiss_text"));
        clearAll.click();
    }

    /**
     * Workaround for swiping down the floating notification displayed on top of the foreground app.
     * As an alternative, we can turn off them using the
     * <pre>
     * {@code adb shell settings put global heads_up_notifications_enabled 0}
     * </pre>
     */
    @SuppressWarnings("unused")
    private void hideNotification() {
        device.swipe(
            200,
            200,
            200,
            100,
            5
        );
    }

    /**
     * @param expectedTitle
     * @param expectedContent
     */
    // @todo switch notif gathering from expected text to generic resource id in order to display accurate assert instead of exc
    // @todo write comment descr
    public void assertNotification(String expectedTitle, String expectedContent) {
        // Retrieve notification title.
        UiObject2 titleItem = device.findObject(By.text(expectedTitle));
        String title = titleItem.getText();

        // Retrieve notification content.
        UiObject2 contentItem = device.findObject(By.textStartsWith(expectedContent));
        String content = contentItem.getText();

        // ...next shouldn't be needed as we don't use notification action
        // Retrieve notification action button.
        // UiObject2 actionButtonItem = device.findObject(By.res(expectedActionButton));
        // String actionButton = actionButtonItem.getText();
        // assert(actionButton.equals(expectedActionButton));

        // Assert found objects equals expected.
        assert(title.equals(expectedTitle));
        assert(content.equals(expectedContent)); // startsWith used in example for some reason
    }

    // @todo write comment descr
    public void tapOnNotification(String expectedTitle) {
        // Retrieve notification.
        UiObject2 titleItem = device.findObject(By.text(expectedTitle));

        // Click on it.
        titleItem.click();
    }


}

