/*
 * @flow
 */

import type { RemoteMessage } from 'react-native-firebase';
import type { Notification, NotificationOpen } from 'react-native-firebase';

import firebase from 'react-native-firebase';

class FirebaseManager {

    constructor() {

    }

    _stopMessageListener: () => mixed;

    async signIn() {
        const credential = await firebase.auth().signInAnonymously();
        if (credential) {
            console.log('default app user ->', credential.user.toJSON());
        }
    }

    async requestPermissions() {
        const enabled = await firebase.messaging().hasPermission();
        if (enabled) {
            // user has permissions
        }
        else {
            // user doesn't have permission
            try {
                await firebase.messaging().requestPermission();
                // User has authorised
            }
            catch (err) {
                // User has rejected permissions
                console.warn('Permission issue: ', err);
            }
        }
    }

    async startMessagingService() {
        // With FCM, you can send two types of messages to clients:

        // Notification messages, sometimes thought of as "display messages." These are handled by the FCM SDK automatically.
        // Data messages, which are handled by the client app.

        // @note Firebase messaging service is probably not useful in our 
        // use cases.
        this._stopMessageListener = firebase
            .messaging()
            .onMessage(
                (message: RemoteMessage) => {
                    // Process your message as required
                    console.warn('@todo implement message: ', message);
                }
            );

        // @todo implement https://stackoverflow.com/questions/37700995/how-to-send-notification-to-specific-users-with-fcm
    }

    // @note never called..
    async stopMessagingService() {
        this._stopMessageListener();
    }

    async startNotificationService() {
        // *foreground app: * Triggered when a particular notification has been received
        this._stopNotificationListener = firebase.notifications().onNotification((notification: Notification) => {
            // Process your notification as required
            console.warn('NotificationListener: Unhandled Notification ', notification);
        });

        // *background app: * Check if app put in Foreground through notification system.
        this._stopNotificationOpenedListener = firebase.notifications().onNotificationOpened((notificationOpen: NotificationOpen) => {
            // Get the action triggered by the notification being opened
            const action = notificationOpen.action;
            // Get information about the notification that was opened
            const notification: Notification = notificationOpen.notification;

            console.warn('NotificationOpenedListener: Unhandled notification', notificationOpen)
        });

        // *background app: * onNotificationDisplayed - [ios] Triggered if content_available set to true 
        this._stopNotificationDisplayedListener = firebase.notifications().onNotificationDisplayed((notification: Notification) => {
            // Process your notification as required
            // ANDROID: Remote notifications do not contain the channel ID. You will have to specify this manually if you'd like to re-display the notification.
            console.warn('NotificationDisplayedListener: Unhandled Notification ', notification);
        });

        // *closed app: * Check if app was opened through notification system.
        const notificationOpen: NotificationOpen = await firebase.notifications().getInitialNotification();
        if (notificationOpen) {
            // App was opened by a notification
            // Get the action triggered by the notification being opened
            const action = notificationOpen.action;
            // Get information about the notification that was opened
            const notification: Notification = notificationOpen.notification;

            console.warn('NotificationOpen [launchtime]: Unhandled notification', action, notification)
        }
    }

    // @note never called..
    stopNotificationService() {
        this._stopNotificationDisplayedListener();
        this._stopNotificationListener();
        this._stopNotificationOpenedListener();
    }
}

const firebaseManager = new FirebaseManager();

export default firebaseManager;
