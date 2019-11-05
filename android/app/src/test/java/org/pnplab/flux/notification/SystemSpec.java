package org.pnplab.flux.notification;

import android.app.Activity;
import android.app.AlarmManager;
import android.app.NotificationManager;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import android.preference.PreferenceManager;

import androidx.test.core.app.ApplicationProvider;
import androidx.test.ext.junit.runners.AndroidJUnit4;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.pnplab.flux.TestApplication;
import org.robolectric.Robolectric;
import org.robolectric.annotation.Config;
import org.robolectric.shadows.ShadowAlarmManager;
import org.robolectric.shadows.ShadowNotificationManager;

import static com.google.common.truth.Truth.assertThat;
import static org.robolectric.Shadows.shadowOf;

@RunWith(AndroidJUnit4.class)
@Config(
    sdk = Build.VERSION_CODES.O_MR1,
    application = TestApplication.class
)
public class SystemSpec {
    private NotificationManager notificationManager;
    private ShadowNotificationManager notificationManagerShadow;
    private AlarmManager alarmManager;
    private ShadowAlarmManager shadowAlarmManager;
    private Object activity;
    private SharedPreferences sharedPreferences;
    private SharedPreferences.Editor sharedPreferencesEditor;

    /**
     * Robolectric v4 doc is very lightweight and thus don't provide any
     * information about how to use robolectric to design our notification
     * tests. However, robolectric's own unit tests are well written! We thus
     * use them as our documentation source. Check
     * ShadowSharedPreferences.java: `https://github.com/robolectric/robolectric/blob/master/robolectric/src/test/java/org/robolectric/shadows/ShadowSharedPreferencesTest.java`
     * ShadowNotificationManagerTest.java: `https://github.com/robolectric/robolectric/blob/master/robolectric/src/test/java/org/robolectric/shadows/ShadowNotificationManagerTest.java`
     * ShadowAlarmManagerTest.java: `https://github.com/robolectric/robolectric/blob/master/robolectric/src/test/java/org/robolectric/shadows/ShadowAlarmManagerTest.java`
     * ShadowApplication.java: `https://github.com/robolectric/robolectric/blob/master/robolectric/src/test/java/org/robolectric/shadows/ShadowApplicationTest.java^
     *    (retrieve registered broadcast receivers)
     * BroadcastReceiver/ShadowContextWrapperTest.java: `https://github.com/robolectric/robolectric/blob/master/robolectric/src/test/java/org/robolectric/shadows/ShadowContextWrapperTest.java`
     * `http://raptordigital.blogspot.com/2014/02/robolectric-broadcastreceiver-and.html`
     */
    @Before
    public void setUp() {
        Context context = ApplicationProvider.getApplicationContext();
        notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        notificationManagerShadow = shadowOf(notificationManager);
        alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        shadowAlarmManager = shadowOf(alarmManager);
        activity = Robolectric.setupActivity(Activity.class);

        // Setup Shared Preferences.
        // sharedPreferences = context.getSharedPreferences("mypref-file", Context.MODE_PRIVATE); -- for specific-file preferences.
        sharedPreferences = PreferenceManager.getDefaultSharedPreferences(context);
        // Ensure no shared preferences have leaked from previous tests.
        assertThat(sharedPreferences.getAll()).hasSize(0);
        sharedPreferencesEditor = sharedPreferences.edit();

        // For alarm manager. Shouldn't be needed.
        // TimeZone.setDefault(TimeZone.getTimeZone("America/Los_Angeles"));
        // assertThat(TimeZone.getDefault().getID()).isEqualTo("America/Los_Angeles");
    }

//    @Test
//    public void it_Should_Set_Up_An_Alarm_With_The_Right_Time() {
//
//    }



    // BROADCAST RECEIVER

//     /**
//     * Let's first test if the BroadcastReceiver, which was defined in the manifest, is correctly
//     * load in our tests
//     */
//    @Test
//    public void testBroadcastReceiverRegistered() {
//        List<ShadowApplication.Wrapper> registeredReceivers = Robolectric.getShadowApplication().getRegisteredReceivers();
//
//        Assert.assertFalse(registeredReceivers.isEmpty());
//
//        boolean receiverFound = false;
//        for (ShadowApplication.Wrapper wrapper : registeredReceivers) {
//            if (!receiverFound)
//                receiverFound = MyBroadcastReceiver.class.getSimpleName().equals(
//                                         wrapper.broadcastReceiver.getClass().getSimpleName());
//        }
//
//        Assert.assertTrue(receiverFound); //will be false if not found
//    }
//
//    @Test
//    public void testIntentHandling() {
//    /** TEST 1
//         ----------
//         We defined the Broadcast receiver with a certain action, so we should check if we have
//         receivers listening to the defined action
//         */
//        Intent intent = new Intent("com.google.android.c2dm.intent.RECEIVE");
//
//        ShadowApplication shadowApplication = Robolectric.getShadowApplication();
//        Assert.assertTrue(shadowApplication.hasReceiverForIntent(intent));
//
//        /**
//         * TEST 2
//         * ----------
//         * Lets be sure that we only have a single receiver assigned for this intent
//         */
//        List<broadcastreceiver> receiversForIntent = shadowApplication.getReceiversForIntent(intent);
//
//        Assert.assertEquals("Expected one broadcast receiver", 1, receiversForIntent.size());
//
//        /**
//         * TEST 3
//         * ----------
//         * Fetch the Broadcast receiver and cast it to the correct class.
//         * Next call the "onReceive" method and check if the MyBroadcastIntentService was started
//         */
//        MyBroadcastReceiver receiver = (MyBroadcastReceiver) receiversForIntent.get(0);
//        receiver.onReceive(Robolectric.getShadowApplication().getApplicationContext(), intent);

    // ALARM SETUP
//      @Test
//      @Config(minSdk = KITKAT)
//      public void setExact_shouldRegisterAlarm_forApi19() {
//        assertThat(shadowAlarmManager.getNextScheduledAlarm()).isNull();
//        alarmManager.setExact(AlarmManager.ELAPSED_REALTIME, 0,
//            PendingIntent.getActivity(activity, 0, new Intent(activity, activity.getClass()), 0));
//        assertThat(shadowAlarmManager.getNextScheduledAlarm()).isNotNull();
//      }
//
//      @Test
//      @Config(minSdk = M)
//      public void setExactAndAllowWhileIdle_shouldRegisterAlarm() {
//        assertThat(shadowAlarmManager.getNextScheduledAlarm()).isNull();
//        alarmManager.setExactAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME, 0,
//            PendingIntent.getActivity(activity, 0, new Intent(activity, activity.getClass()), 0));
//        assertThat(shadowAlarmManager.getNextScheduledAlarm()).isNotNull();
//      }

//      @Test
//      @Config(minSdk = N)
//      public void setExact_shouldRegisterAlarm_forApi124() {
//        assertThat(shadowAlarmManager.getNextScheduledAlarm()).isNull();
//        OnAlarmListener listener = () -> {};
//        alarmManager.setExact(AlarmManager.ELAPSED_REALTIME, 0, "tag", listener, null);
//        assertThat(shadowAlarmManager.getNextScheduledAlarm()).isNotNull();
//      }
//

    // ALARM REPLACE
//  @Test
//  public void set_shouldReplaceAlarmsWithSameIntentReceiver() {
//    alarmManager.set(AlarmManager.ELAPSED_REALTIME, 500,
//        PendingIntent.getActivity(activity, 0, new Intent(activity, activity.getClass()), 0));
//    alarmManager.set(AlarmManager.ELAPSED_REALTIME, 1000,
//        PendingIntent.getActivity(activity, 0, new Intent(activity, activity.getClass()), 0));
//    assertThat(shadowAlarmManager.getScheduledAlarms()).hasSize(1);
//  }


    // NOTIF
//
//    @Test
//    @Config(minSdk = Build.VERSION_CODES.N)
//    public void areNotificationsEnabled() {
//        shadowOf(notificationManager).setNotificationsEnabled(true);
//        assertThat(notificationManager.areNotificationsEnabled()).isTrue();
//        shadowOf(notificationManager).setNotificationsEnabled(false);
//        assertThat(notificationManager.areNotificationsEnabled()).isFalse();
//    }
//
//    // Not sure this is needed
//    // https://stackoverflow.com/questions/41308512/permissions-needed-for-notificationmanager
//    // `startActivityForResult(new Intent(android.settings.NOTIFICATION_POLICY_ACCESS_SETTINGS), 0);`
//    // => direct the user to the "Show Do Not Disturb access settings" and have him enable the option for notification management
//    @Test
//    @Config(minSdk = Build.VERSION_CODES.M)
//    public void isNotificationPolicyAccessGranted() {
//        shadowOf(notificationManager).setNotificationPolicyAccessGranted(true);
//        assertThat(notificationManager.isNotificationPolicyAccessGranted()).isTrue();
//        shadowOf(notificationManager).setNotificationPolicyAccessGranted(false);
//        assertThat(notificationManager.isNotificationPolicyAccessGranted()).isFalse();
//    }

//  @Test
//  public void testNotify() throws Exception {
//    notificationManager.notify(1, notification1);
//    assertEquals(1, shadowOf(notificationManager).size());
//    assertEquals(notification1, shadowOf(notificationManager).getNotification(null, 1));
//
//    notificationManager.notify(31, notification2);
//    assertEquals(2, shadowOf(notificationManager).size());
//    assertEquals(notification2, shadowOf(notificationManager).getNotification(null, 31));
//  }
//
//  @Test
//  public void testNotifyReplaces() throws Exception {
//    notificationManager.notify(1, notification1);
//
//    notificationManager.notify(1, notification2);
//    assertEquals(1, shadowOf(notificationManager).size());
//    assertEquals(notification2, shadowOf(notificationManager).getNotification(null, 1));
//  }
//  @Test
//  @Config(minSdk = Build.VERSION_CODES.M)
//  public void testGetActiveNotifications() throws Exception {
//    notificationManager.notify(1, notification1);
//    notificationManager.notify(31, notification2);
//
//    StatusBarNotification[] statusBarNotifications =
//        shadowOf(notificationManager).getActiveNotifications();
//
//    assertThat(asNotificationList(statusBarNotifications))
//        .containsExactly(notification1, notification2);
//  }
//
//  private static List<Notification> asNotificationList(
//      StatusBarNotification[] statusBarNotifications) {
//    List<Notification> notificationList = new ArrayList<>(statusBarNotifications.length);
//    for (StatusBarNotification statusBarNotification : statusBarNotifications) {
//      notificationList.add(statusBarNotification.getNotification());
//    }
//    return notificationList;
//  }

//
//    @Test
//    public void it_Should_Display_Weekly_Tasks_With_Android_Oreo_Plus_Using_Notification_Chanel() {
//
//    }
//
//    @Test
//    public void it_Should_Reschedule_Daily_Tasks_Notification_On_Phone_Reboot() {
//
//    }
//
//    @Test
//    public void it_Should_Reschedule_Weekly_Tasks_Notification_On_Phone_Reboot() {
//
//    }
//
//    @Test
//    public void it_Should_Display_Daily_Tasks_Notification_On_Phone_Idle() {
//
//    }
//
//    @Test
//    public void it_Should_Display_Weekly_Tasks_Notification_On_Phone_Idle() {
//
//    }

}
