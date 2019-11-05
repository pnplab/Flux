/**
 * @flow
 */

import 'react-native';

// @note test renderer must be required after react-native.
import NotificationManager from '../../crossplatform-model/native-db/NotificationManager';
import moment from 'moment';

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
//
// We do not do jest javascript TDD for the notifications use case...
// Hard to mock Firebase notifications: Saw the following usage from the same
// official doc page, and need them all. Also, they rely on a builder pattern
// which makes this timely to mock. We'll rely on e2e testing.
// - `new firebase.notifications.Android...`
// - `firebase.notifications.Android...`
// - `firebase.notifications().android...`
describe('notifications', () => {

    describe('Reminder for daily task policy', () => {

        it('should be scheduled in 3 days (on the third day, after 2 days without survey task achieved) at 18:00', async () => {
            // Given last survey task was sent on may 28th.
            const lastSurveyTaskTimestampMs = moment('2019-05-28 20:00', 'YYYY-MM-DD HH:mm').valueOf();

            // When we calculate the next notification schedule for daily task
            // study.
            const scheduledMs = NotificationManager.getScheduledTimestampForTwoMissedDay(lastSurveyTaskTimestampMs);

            // Then, result should be 3 days later at 19h so the notification
            // is displayed after 2 days without task. The notification
            // scheduling will be canceled if a new task is done inbetween.
            const expectedMs = moment('2019-05-31 18:00', 'YYYY-MM-DD HH:mm').valueOf();
            expect(scheduledMs).toBe(expectedMs);
        });

    });

    describe('Reminder for daily weekly policy', () => {

        it('should be scheduled next week at 18:00', async () => {
            // Given last survey task was sent on may 28th.
            const lastSurveyTaskTimestampMs = moment('2019-05-21 20:00', 'YYYY-MM-DD HH:mm').valueOf();

            // When we calculate the next notification schedule for daily task
            // study.
            const scheduledMs = NotificationManager.getScheduledTimestampForNextWeek(lastSurveyTaskTimestampMs);

            // Then, result should be 3 days later at 19h so the notification
            // is displayed after 2 days without task. The notification
            // scheduling will be canceled if a new task is done inbetween.
            const expectedMs = moment('2019-05-28 18:00', 'YYYY-MM-DD HH:mm').valueOf();
            expect(scheduledMs).toBe(expectedMs);
        });

    });

});