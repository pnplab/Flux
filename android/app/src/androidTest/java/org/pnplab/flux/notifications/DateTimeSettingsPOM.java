package org.pnplab.flux.notifications;

import android.content.Context;
import android.content.Intent;
import android.os.RemoteException;
import android.util.Log;

import androidx.test.core.app.ApplicationProvider;
import androidx.test.uiautomator.By;
import androidx.test.uiautomator.UiCollection;
import androidx.test.uiautomator.UiDevice;
import androidx.test.uiautomator.UiObject;
import androidx.test.uiautomator.UiObject2;
import androidx.test.uiautomator.UiObjectNotFoundException;
import androidx.test.uiautomator.UiScrollable;
import androidx.test.uiautomator.UiSelector;
import androidx.test.uiautomator.Until;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

// Some helper class to set the time for notifications using UIAutomator, only works with english
// android and only tested w/ android v28.
//
// For DateTimeFormatter doc, used at multiple time in this class, see
// `https://docs.oracle.com/javase/8/docs/api/java/time/format/DateTimeFormatter.html`.
// @note Have found this lib that provides helper function to handle datepicker and timepicker in
// android after writing these tests `https://github.com/AdevintaSpain/Barista`.
// @todo make that class locale agnostic and inject it class into Barista framework :-)
public class DateTimeSettingsPOM {

    private final UiDevice device;
    private final long timeout;

    public DateTimeSettingsPOM(UiDevice device, long timeout) {
        this.device = device;
        this.timeout = timeout;
    }

    /**
     * Open the android Settings app at the date & time panel.
     */
    public void openSettings() {
        // Start from the home screen
        device.pressHome();

        // Wait for launcher
        final String launcherPackage = device.getLauncherPackageName();
        assert(launcherPackage != null);
        device.wait(Until.hasObject(By.pkg(launcherPackage).depth(0)), timeout);

        // Get context (of Home app ?).
        Context context = ApplicationProvider.getApplicationContext();

        // Launch Date & Time settings.
        final Intent intent = new Intent(android.provider.Settings.ACTION_DATE_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);
    }

    /**
     * Enable manual time settings.
     *
     * @pre User must be in settings (see `#openSettings`).
     * @post User is in settings.
     *
     * @throws UiObjectNotFoundException
     */
    public void enableManualDateTime() throws UiObjectNotFoundException {
        // Toggle automatic date & time off.
        UiScrollable dateTimeSettingList = new UiScrollable(new UiSelector().className("android.support.v7.widget.RecyclerView"));
        UiObject automaticDateTimeOption = dateTimeSettingList.getChildByText(new UiSelector().className("android.widget.LinearLayout"), "Automatic date & time");
        UiObject automaticDateTimeSwitch = automaticDateTimeOption.getChild(new UiSelector().className("android.widget.Switch"));
        if (automaticDateTimeSwitch.isChecked()) {
            automaticDateTimeSwitch.click();
        }
    }

    /**
     * Set the time automatically based on NTP server sync. Disable manual time settings.
     *
     * @pre User must be in settings (see `#openSettings`).
     * @post User is in settings.
     *
     * @throws UiObjectNotFoundException
     */
    public void disableManualDateTime() throws UiObjectNotFoundException {
        // Turn automatic date & time on.
        UiScrollable dateTimeSettingList = new UiScrollable(new UiSelector().className("android.support.v7.widget.RecyclerView"));
        UiObject automaticDateTimeOption = dateTimeSettingList.getChildByText(new UiSelector().className("android.widget.LinearLayout"), "Automatic date & time");
        UiObject automaticDateTimeSwitch = automaticDateTimeOption.getChild(new UiSelector().className("android.widget.Switch"));
        if (!automaticDateTimeSwitch.isChecked()) {
            automaticDateTimeSwitch.click();
        }
    }

    /**
     * Change the phone's date and time settings.
     *
     * @param datetimeStr "yyyy-MM-dd HH:mm" format. seconds throw exception.
     *
     * @pre User must be in settings (see `#openSettings`).
     * @post User is in settings.
     */
    public void setIsoDateTime(String datetimeStr) throws UiObjectNotFoundException {
        // Split datetime into date and time str.
        LocalDateTime dateTime = LocalDateTime.parse(datetimeStr, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
        LocalDate localDate = dateTime.toLocalDate();
        LocalTime localTime = dateTime.toLocalTime();
        String localDateStr = localDate.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        String localTimeStr = localTime.format(DateTimeFormatter.ofPattern("HH:mm"));

        // Apply date and time setting changes.
        setIsoDate(localDateStr);
        setIsoTime(localTimeStr);
    }

    /**
     * Set the current date.
     *
     * @param dateStr "yyyy-MM-dd" format
     *
     * @pre User must be in settings (see `#openSettings`).
     * @pre Automatic date time must be disabled (see `#enableManualDateTime`).
     * @post User is in settings.
     *
     * @throws UiObjectNotFoundException
     */
    public void setIsoDate(String dateStr) throws UiObjectNotFoundException {
        // Open Set date panel.
        UiScrollable dateTimeSettingList = new UiScrollable(new UiSelector().className("android.support.v7.widget.RecyclerView"));
        UiObject setDate = dateTimeSettingList.getChildByText(new UiSelector().className("android.widget.TextView"), "Set date");
        setDate.click();

        // Get current day, month and year.
        UiObject yearItem = new UiObject(new UiSelector().resourceId("android:id/date_picker_header_year"));
        String year = yearItem.getText();
        UiObject dateWithoutYearItem = new UiObject(new UiSelector().resourceId("android:id/date_picker_header_date"));
        String dateWithoutYear = dateWithoutYearItem.getText(); // ie. `Wed, Oct 9`

        // Parse it as a date object.
        DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("E, MMM d yyyy");
        dateTimeFormatter = dateTimeFormatter.withLocale(Locale.US);
        // Line commented out because doesn't parse with dual locale for some reason...
        // dateTimeFormatter = dateTimeFormatter.withLocale(Locale.FRENCH);
        LocalDate outputDate = LocalDate.parse(dateWithoutYear + " " + year, dateTimeFormatter);

        // Set target date.
        LocalDate targetDate = LocalDate.parse(dateStr);

        // Get date diff.
        Period period = Period.between(outputDate, targetDate);
        int yearDiff = period.getYears();
        int monthDiff = period.getMonths() + (yearDiff * 12);
        period = period.minusMonths(monthDiff);
        int dayDiff = period.getDays();

        // Log.
        Log.i("TAG", dateStr + " " + targetDate.toString() + " " + monthDiff + " " + targetDate.getDayOfMonth());

        // Cycle through months.
        if (monthDiff == 0) {
            // ...nothing to do. Currently on the right month.
        }
        // Go backward until targeted month is selected.
        else if (monthDiff < 0) {
            for (int i=monthDiff; i<0; ++i) {
                UiObject previousMonthButtonItem = new UiObject(new UiSelector().resourceId("android:id/prev"));
                previousMonthButtonItem.click();
            }
        }
        // Go forward until targeted month is selected.
        else if (monthDiff > 0) {
            for (int i=0; i<monthDiff; ++i) {
                UiObject nextMonthButtonItem = new UiObject(new UiSelector().resourceId("android:id/next"));
                nextMonthButtonItem.click();
            }
        }

        // Select the target day.
        UiCollection dayList = new UiCollection(new UiSelector().resourceId("android:id/month_view"));
        UiObject dayItem = dayList.getChildByText(new UiSelector().className("android.view.View"), "" + targetDate.getDayOfMonth());
        dayItem.click();

        // Accept.
        UiObject okButton = new UiObject(new UiSelector().resourceId("android:id/button1"));
        okButton.click();
    }

    /**
     * Set the current time.
     *
     * @param timeStr "hh:mm" format. seconds throw exception.
     *
     * @pre User must be in settings (see `#openSettings`).
     * @pre Automatic date time must be disabled (see `#enableManualDateTime`).
     * @post User is in settings.
     *
     * @throws UiObjectNotFoundException
     */
    public void setIsoTime(String timeStr) throws UiObjectNotFoundException {
        // Open `Set time` panel.
        UiScrollable dateTimeSettingList = new UiScrollable(new UiSelector().className("android.support.v7.widget.RecyclerView"));
        UiObject setTime = dateTimeSettingList.getChildByText(new UiSelector().className("android.widget.TextView"), "Set time");
        setTime.click();

        // Switch to input mode.
        UiObject toggleButton = new UiObject(new UiSelector().resourceId("android:id/toggle_mode"));
        toggleButton.click();

        // Set target time.
        LocalTime targetTime = LocalTime.parse(timeStr);
        String targetTimeMode = targetTime.format(DateTimeFormatter.ofPattern("a")); // a == AM | PM
        String targetHour = targetTime.format(DateTimeFormatter.ofPattern("h")); // h == 1-12
        String targetMinute = "" + targetTime.getMinute();

        // Get PM / AM.
        UiScrollable spinner = new UiScrollable(new UiSelector().resourceId("android:id/am_pm_spinner"));
        UiObject spinnerText = spinner.getChild(new UiSelector().resourceId("android:id/text1"));
        String timeMode = spinnerText.getText();

        // Log
        Log.i("TAG", timeStr + " " + targetTimeMode + " " + targetHour + " " + targetMinute);

        // Toggle time mode if needed.
        if (!timeMode.equals(targetTimeMode)) {
            // Open spinner list.
            spinner.click();

            // Select target time mode item.
            UiObject2 targetTimeModeObject = device.findObject(By.text(targetTimeMode));
            targetTimeModeObject.click();
        }

        // Select Hour
        UiObject2 inputHour = device.findObject(By.res("android:id/input_hour"));
        inputHour.setText(targetHour);

        // Select minute
        UiObject2 inputMinute = device.findObject(By.res("android:id/input_minute"));
        inputMinute.setText(targetMinute);

        // Accept.
        UiObject2 okButton2 = device.findObject(By.text("OK"));
        okButton2.click();
    }

    /**
     * Close the android Settings app.
     *
     * @throws RemoteException
     * @throws UiObjectNotFoundException
     */
    public void closeSettingsAndReturnToHome() throws RemoteException, UiObjectNotFoundException {
        // Close settings.
        device.pressRecentApps();
        UiObject app = new UiObject(new UiSelector().description("Settings Date & time"));
        app.swipeUp(100);

        // Return to home screen (quit recent app panel).
        device.pressHome();
    }

    /**
     * Return the current phone's iso datetime read from the date & time settings panel. Relevant
     * method to test this class' other ones ;)
     *
     * @return iso datetime "yyyy-MM-dd HH:mm" format.
     *
     * @pre User must be in settings (see `#openSettings`).
     * @post User is in settings.
     *
     * @throws UiObjectNotFoundException
     */
    public String readIsoDateTime() throws UiObjectNotFoundException {
        // Get date string.
        UiScrollable dateTimeSettingList = new UiScrollable(new UiSelector().className("android.support.v7.widget.RecyclerView"));
        UiObject setDateItem = dateTimeSettingList.getChildByText(new UiSelector().className("android.widget.RelativeLayout"), "Set date");
        UiObject dateObject = setDateItem.getChild(new UiSelector().resourceId("android:id/summary"));
        String dateStr = dateObject.getText();

        // Get time string.
        UiObject setTimeItem = dateTimeSettingList.getChildByText(new UiSelector().className("android.widget.RelativeLayout"), "Set time");
        UiObject timeObject = setTimeItem.getChild(new UiSelector().resourceId("android:id/summary"));
        String timeStr = timeObject.getText();

        // Parse retrieved strings into local date.
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMMM d, yyyy h:mm a", Locale.US);
        LocalDate datetime = LocalDate.parse(dateStr + " " + timeStr, formatter);

        // Format local date into iso string.
        String isoDatetime = datetime.toString();
        return isoDatetime;
    }
}
