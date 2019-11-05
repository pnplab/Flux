/**
 * @flow
 */

import 'react-native';
import React from 'react';

// @note test renderer must be required after react-native.
import { render } from 'react-native-testing-library';
import App from '../../App';
import realm from '../../crossplatform-model/persistent-db'; // Only used to reset state.
import NotificationManager from '../../crossplatform-model/native-db/NotificationManager';

// The only way to test notification integration effectively is through java
// UIAutomator. cf. `https://alexzh.com/2018/06/16/guide-testing-android-notifications/`.
// It is however difficult to change the time of the device programatically in
// order to set up the context for notification to happen cf.
// `https://stackoverflow.com/questions/17939572/how-to-set-time-to-device-programmatically`.
// It's possible outside tests through adb (and inside tests w/ appium
// cf. `http://appium.io/docs/en/writing-running-appium/android/android-shell/`).
// It seems possible to do it in tests through ProcessExecutor class but that seems
// unsafe `https://www.swtestacademy.com/adb-commands-java-device-manipulation/`
// and probably impossible with unrooted devices cf.
// `https://stackoverflow.com/questions/6584772/is-possible-to-set-system-datetime-from-my-android-app`.
// The only option that stands left is to set time through settings and use
// UIAutomator2 to do so automatically. Appium can't be used as it doesn't
// provide the underlying UIAutomator API (even though he uses it) to tests the
// notifications (as they appears outside of the app).
// `https://stackoverflow.com/questions/9434239/set-androids-date-time-programmatically/9434344`
// can help to launch the correct setting tab.
//
// Thus can either we test the mocked notification API and hope for the best
// (as manual testing requires to change system times and stuff so wont do) or
// do these as e2e tests in Java.
describe('notifications', () => {

    describe('Reminder for daily task policy', () => {

        // duration
        it('should be scheduled 2 days later at 19:00 (when tasks are availables)', () => {

        });

        // <App> reschedule -> once test fullfiled

        it('should be scheduled to be displayed if the user has not done any task in the past 2 days', () => {
            // When a user first completes a task.

            // Then, previous 2-days reminder should be canceled.

            // Then, a new 2-days reminder should be scheduled.
        });

        // <App> launch time -> once user is registered /
        // <App> launch time -> once test is registered

        it('should be scheduled to be displayed even if the user has not completed any task ever', () => {
            // When a user first open the app and has done no task yet.

            // Then, the first reminder should be scheduler.
        });


    });

});

xdescribe('Notification2', () => {

    xit('should be tested for iOS', () => {
        // ...some iOS specificities have to be checked for. This testing file
        // currently only apply to android notifications, although the firebase
        // notification API is mostly shared across platforms.
        expect(true).toBe(false);
    });

    describe('Onboarding', () => {

        xit('should request notification permission', () => {
            // These permission should have been already asked through onboarding
            // CheckPermission page.

            // checkPermission = async () => {
            //     const enabled = await firebase.messaging().hasPermission();
            //     if (enabled) {
            //        return true;
            //     } else {
            //         // user doesn't have permission
            //         try {
            //             await firebase.messaging().requestPermission();
            //             return true;
            //         } catch (error) {
            //             Alert.alert("Unable to access the Notification permission. Please enable the Notification Permission from the settings");
            //             return false;
            //         }
            //     }
            // };
        });

        xit('should create a notification channel on android 8.0+', () => {
            // As of Android 8.0 (API Level 26), notifications must specify a
            // Notification Channel or they will not appear. cf.
            // `https://medium.com/better-programming/react-native-local-scheduled-push-notification-with-firebase-8c775b71c35c`.

            // createNotificationChannel = () => {
            //     // Build a android notification channel
            //     const channel = new firebase.notifications.Android.Channel(
            //         "reminder", // channelId
            //         "Reminders Channel", // channel name
            //         firebase.notifications.Android.Importance.High // channel importance
            //     ).setDescription("Used for getting reminder notification"); // channel description
            //     // Create the android notification channel
            //     firebase.notifications().android.createChannel(channel);
            // };

        });

        it('should redirect to onboarding when permissions are no longer granted', () => {

        });

    });

    describe('Daily Task Policy Reminder', () => {

        // buildNotification = () => {
        //   const title = Platform.OS === "android" ? "Daily Reminder" : "";
        //   const notification = new firebase.notifications.Notification()
        //     .setNotificationId("1") // Any random ID
        //     .setTitle(title) // Title of the notification
        //     .setBody("This is a notification") // body of notification
        //     .android.setPriority(firebase.notifications.Android.Priority.High) // set priority in Android
        //     .android.setChannelId("reminder") // should be the same when creating channel for Android
        //     .android.setAutoCancel(true); // To remove notification when tapped on it
        //     return notification;
        // };
        //
        //             // schedule notification      
        //     firebase.notifications().scheduleNotification(this.buildNotification(), {
        //       fireDate: notificationTime.valueOf(),
        //       repeatInterval: 'day',
        //       exact: true,
        //     });

        it('should be displayed when the user has not done the task the last 2 days', () => {

        //         // We've the permission
        //         this.notificationListener = firebase
        //             .notifications()
        //             .onNotification(async notification => {
        //                 // Display your notification
        //                 await firebase.notifications().displayNotification(notification);
        //             });
        });

        it('should be displayed when the task is available (at 18h)', () => {

        });

        describe('when notification has been received while the app was closed', () => {

            it('should be displayed as a popup', () => {

            });

            it('should open the app on click', () => {

            });

            it('should be stored', () => {

            });

        });

        describe('when notification has been received while the app is opened in background', () => {

            it('should be displayed as a popup', () => {

            });

            it('should be stored', () => {

            });

        });

        describe('when notification has been received while the app is opened in foreground', () => {

            it('should be stored', () => {

            });

        });

    });

    xdescribe('Weekly Task Policy Reminder', () => {

        it('should be displayed when the user has not done the task last week', () => {

        });

        it('should be displayed when the task is available (on sunday at 18h)', () => {

        });

        it('should be displayed when the app is closed', () => {

        });

    });

    xdescribe('remote', () => {

    });

});