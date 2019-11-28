/**
 * @flow
 */

// @todo Move out of react-native-firebase as it requires google play services
//     (like much of android app though - had read a third at some point).
import type { Notification, NotificationOpen } from 'react-native-firebase';

// @note When using firebase notifications with `new`, we dereference
// through modules using `.notifications.Notification()`. When using
// firebase notifications with pure function, it's called through
// `.notifications()`.
import firebase from 'react-native-firebase';
import { Platform, Alert } from 'react-native';
import moment from 'moment';

const NOTIFICATION_HOUR = 18;

// Forward notification receipt when app is in foreground to notification
// display. Copied from the following article:
// `https://medium.com/@katharinep/firebase-notification-integration-in-react-native-0-60-3a8d6c8d56ff`.
// This article is linked from official react-native firebase notification doc.
// Not sure it's effective has the original method seems hastily written, it
// uses the async keyword cluelessly.
const createNotificationListeners = () => {
    const channelId = 'reminder';

    firebase
        .notifications()
        .onNotification(async notification => {
            notification.android.setChannelId(channelId).setSound('default');
            await firebase.notifications().displayNotification(notification);
        });
};
// @warning can this be placed here in global flow ? A bit smelly but this is
// just forwarding flow between OS stuffs. Will be executed at app launch. Will
// break if we move to dynamic import in the future (unlikely).
createNotificationListeners();

class NotificationManager {

    schedule = async (opts: { studyModality: 'daily' | 'weekly' }): Promise<void> => {
        // Request notification permissions. This should have already been done
        // during the Onboarding process. We do not know if user has manually
        // disabled them since though.
        await this.requestPermission();

        // Create a notification chanel for android (required for Android O+).
        this.createNotificationChannel();

        // Build the notification.
        const notification = this.buildNotification();

        // Set timestamp in two minutes.
        const now = new Date().valueOf();
        // Set lastSurveyTaskTimestampMs to now, has scheduling only occurs
        // when no survey has been ever done yet or has just been finished.
        // A bit dirty in theory, but not so much in practice, shouldn't break.
        const lastSurveyTaskTimestampMs = now;
        let timestamp = undefined;
        switch(opts.studyModality) {
        case 'daily':
            timestamp = this.getScheduledTimestampForTwoMissedDay(lastSurveyTaskTimestampMs);
            break;
        case 'weekly':
            timestamp = this.getScheduledTimestampForNextWeek(lastSurveyTaskTimestampMs);
            break;
        default:
            throw new Error('Unexpected opts studyModality while scheduling notification.');
        }

        // Schedule it.
        await this.scheduleNotification(notification, timestamp);
    };

    reschedule = async (opts: { studyModality: 'daily' | 'weekly' }): Promise<void> => {
        // Request notification permissions. This should have already been done
        // during the Onboarding process. We do not know if user has manually
        // disabled them since though.
        await this.requestPermission();

        // Create a notification chanel for android (required for Android O+).
        this.createNotificationChannel();

        // Cancel the previous notification!
        // @todo refactor this #reschedule method if we're sure
        //     cancelNotification doesn't need createNotificationChannel and
        //     requestPermission.
        await this.cancelNotification();

        // Rebuild the notification.
        const notification = this.buildNotification();

        // Set timestamp in two minutes.
        const now = new Date().valueOf();
        // Set lastSurveyTaskTimestampMs to now, has scheduling only occurs
        // when no survey has been ever done yet or has just been finished.
        // A bit dirty in theory, but not so much in practice, shouldn't break.
        const lastSurveyTaskTimestampMs = now;
        let timestamp = undefined;
        switch (opts.studyModality) {
        case 'daily':
            timestamp = this.getScheduledTimestampForTwoMissedDay(lastSurveyTaskTimestampMs);
            break;
        case 'weekly':
            timestamp = this.getScheduledTimestampForNextWeek(lastSurveyTaskTimestampMs);
            break;
        default:
            throw new Error('Unexpected opts studyModality while scheduling notification.');
        }

        // Schedule it.
        await this.scheduleNotification(notification, timestamp);
    };

    getScheduledTimestampForTwoMissedDay = (lastSurveyTaskTimestampMs: number): number => {
        // Considering we've just achieved the survey task for daily task
        // modality.
        let lastSurveyTaskMoment = moment(lastSurveyTaskTimestampMs);

        // Add 3 days:
        // when 2 days without task done,
        // notify on the third one.
        lastSurveyTaskMoment.add(3, 'days');

        // Fix the notification hour to 18h.
        lastSurveyTaskMoment.set('hour', NOTIFICATION_HOUR);

        // Return next notification schedule timestamp.
        const scheduledNotificationTimestampMs = lastSurveyTaskMoment.valueOf();
        return scheduledNotificationTimestampMs;
    };

    getScheduledTimestampForNextWeek = (lastSurveyTaskTimestampMs: number): number => {
        // Considering we've just achieved the survey task for weekly task
        // modality, we're thus on sunday.
        let lastSurveyTaskMoment = moment(lastSurveyTaskTimestampMs);

        // Add 1 week.
        lastSurveyTaskMoment.add(1, 'week');

        // Fix the notification hour to 18h.
        lastSurveyTaskMoment.set('hour', NOTIFICATION_HOUR);

        // Return next notification schedule timestamp.
        const scheduledNotificationTimestampMs = lastSurveyTaskMoment.valueOf();
        return scheduledNotificationTimestampMs;
    };

    requestPermission = async () => {
        const enabled = await firebase
            .messaging()
            .hasPermission();

        // Do nothing if user already have the permission.
        if (enabled) {
            return true;
        }
        // Request permission when user doesn't have it.
        else {
            try {
                await firebase
                    .messaging()
                    .requestPermission();
                return true;
            }
            catch (error) {
                Alert.alert('Unable to access the Notification permission. Please enable the Notification Permission from the settings');
                return false;
            }
        }
    };

    // As of Android 8.0 (API Level 26), notifications must specify a
    // Notification Channel or they will not appear. cf.
    // `https://medium.com/better-programming/react-native-local-scheduled-push-notification-with-firebase-8c775b71c35c`.
    createNotificationChannel = () => {
        const channelId = 'reminder';

        // @warning May throw. Not clear whether
        // - this should be called once the app is first launched.
        // - this should be called at every app launch.
        // - this can be called before every notification schedule.
        // We go for the third option. Looking at examples this should be fine.

        // Trigger heads-up notifications for Android >= 8:
        // The notification channel has high importance on devices running
        // Android 8.0 (API level 26) and higher. cf.
        // https://developer.android.com/guide/topics/ui/notifiers/notifications
        const priority = firebase
            .notifications
            .Android
            .Importance
            .High;

        // Build a android notification channel.
        const channel = new firebase
            .notifications
            .Android
            .Channel(
                channelId, // channelId
                'Reminders Channel', // channel name
                priority // channel importance
            )
            .setDescription('Used for getting reminder notification'); // channel description

        // Create the android notification channel.
        firebase
            .notifications()
            .android
            .createChannel(channel);
    };

    buildNotification = (): Notification => {
        const notificationId = '1';
        const channelId = 'reminder';
        const title = Platform.OS === 'android' ?
            'Flux' :
            '';
        const body = 'Merci de compléter le questionnaire et la tâche entre 18h et 22h.';

        // Trigger heads-up notifications for Android < 8:
        // The notification has high priority and uses ringtones or
        // vibrations on devices running Android 7.1 (API level 25) and
        // lower.
        // cf. https://developer.android.com/guide/topics/ui/notifiers/notifications
        const priority = firebase.notifications.Android.Priority.High;

        const notification = new firebase
            .notifications
            .Notification()
            .setNotificationId(notificationId) // Any random ID.
            .setTitle(title) // Title of the notification.
            .setBody(body) // body of notification.
            .android.setPriority(priority) // set priority in Android.
            .android.setChannelId(channelId) // should be the same when creating channel for Android.
            .android.setAutoCancel(true); // To remove notification when tapped on it.

        return notification;
    };

    cancelNotification = async (): Promise<void> => {
        const notificationId = '1';

        // Cancel the scheduled notification.
        // @warning doc is not clear whether this cancel a pending notification
        // or a scheduled notification. Probably the latter because there is a
        // `removeDeliveredNotification` function but these are differents use
        // case on android API nonetheless. I am wondering especially since
        // it's possible to schedule multiple time the same notification. This
        // probably equates to `cancel all notification's scheduling`.
        firebase
            .notifications()
            .cancelNotification(notificationId);
    };

    scheduleNotification = async (notification: Notification, timestamp: number): Promise<void> => {
        // Schedule notification.
        await firebase
            .notifications()
            .scheduleNotification(notification, {
                fireDate: timestamp,
                exact: true,
            });
    };

}

export default new NotificationManager();