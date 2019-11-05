/**
 * @flow
 * @format
 *
 * We need to test App rendering because testing on emulator fails: Indeed, js
 * debugger crashes because of Realm. This makes mocking absolutely mandatory to
 * be able to use the js debugger. cf.
 * `https://github.com/realm/realm-js/issues/1407#issuecomment-537810328`
 */

import 'react-native';
import React from 'react';
import App from '../../App';
import realm from '../../crossplatform-model/persistent-db'; // Only used to reset state.
import NotificationManager from '../../crossplatform-model/native-db/NotificationManager';

// @note test renderer must be required after react-native.
// @note A11y stands for Accessibility.
import { render } from 'react-native-testing-library';

import * as pom from '../page-object-models';

// Fixes `ReferenceError: You are trying to `import` a file after the Jest
// environment has been torn down.`. Appearing among other things when using
// animated components (such as somes in `native-base`, so as many places in
// our interface). see `https://github.com/facebook/jest/issues/4359` and
// `https://github.com/facebook/jest/issues/6434`.
jest.useFakeTimers();

describe('task scheduling: notifications', () => {

    describe('<App> (dataflow testing)', () => {

        afterEach(async () => {
            // Reset mocked realmjs db between tests.
            // Unfortunately, `jest.resetModules();` doesn't work, likely because
            // mocked modules rely on import syntax cf. `https://github.com/facebook/jest/issues/3236`.
            // We've tested manual `require` of the root import after
            // `jest.resetModules()` and it's not enough to reset the module.
            // Only way for us is to reset the db manually. The __reset__ function
            // has been added to the realm mock.
            const db = await realm;
            db.__reset__();
        });

        describe('<Onboarding>', () => {

            describe('<Auth>', () => {

                it('should schedule the first task reminder notification for daily study modality when the user authentificates using the `371olh` test-scenario password', async () => {
                    // Mock `NotificationManager.schedule` function.
                    const spy = jest.spyOn(NotificationManager, 'schedule').mockImplementation(() => { });

                    // Given no user has been setup yet.
                    // ...nothing needs to be set, this is the initial setup.

                    // Given the root component is displayed.
                    const app = render(<App />);

                    // Once empty user settings have been loaded and <AppLoader>
                    // has redirect the App to the <Auth> component.
                    const appLoader = new pom.AppLoader();
                    await appLoader.untilAppHasBeenLoaded();

                    // When the user authentificates with any random device id and
                    // the `371olh` password.
                    const onboarding = new pom.Onboarding(app);
                    await onboarding.auth('testdevice', '371olh');

                    // Then, notification should be scheduled.
                    expect(NotificationManager.schedule).toHaveBeenCalledWith({ studyModality: 'daily' });

                    // Restore mock.
                    spy.mockRestore();
                });

            });

            describe('<OnboardingEnd>', () => {

                xit('should schedule the first task reminder notification in two days at 19:00 when the user authentificates using the `4wc2uw` daily study modality password', async () => {
                    // Mock `NotificationManager.schedule` function.
                    const spy = jest.spyOn(NotificationManager, 'schedule').mockImplementation(() => { });

                    // Given no user has been setup yet.
                    // ...nothing needs to be set, this is the initial setup.

                    // Given the root component is displayed.
                    const app = render(<App />);

                    // Once empty user settings have been loaded and <AppLoader>
                    // has redirect the App to the <Auth> component.
                    const appLoader = new pom.AppLoader();
                    await appLoader.untilAppHasBeenLoaded();

                    // Then, notification should be scheduled.
                    expect(NotificationManager.schedule).toHaveBeenCalledWith({ studyModality: 'daily' });

                    // Restore mock.
                    spy.mockRestore();
                });

                xit('should schedule the first task reminder notification for next week sunday at 19:00 when the user authentificates using the `f32bts` weekly study modality password', () => {
                    // Mock `NotificationManager.schedule` function.
                    const spy = jest.spyOn(NotificationManager, 'schedule').mockImplementation(() => { });

                    // Then, notification should be scheduled.
                    expect(NotificationManager.schedule).toHaveBeenCalledWith({ studyModality: 'weekly' });

                    // Restore mock.
                    spy.mockRestore();
                });

            });

        });

        describe('<SurveyTask>', () => {

            xit('should reschedule the reminder notification in two days at 19:00 given the study has a daily task modality', async () => {
                // Mock `NotificationManager.schedule` function.
                const spy = jest.spyOn(NotificationManager, 'reschedule').mockImplementation(() => { });

                // Given no user has been setup yet.
                // ...nothing needs to be set, this is the initial setup.

                // Given the root component is displayed.
                const app = render(<App />);

                // Once empty user settings have been loaded and <AppLoader>
                // has redirect the App to the <Auth> component.
                const appLoader = new pom.AppLoader();
                await appLoader.untilAppHasBeenLoaded();

                // Then, notification should be rescheduled.
                expect(NotificationManager.reschedule).toHaveBeenCalledWith({ studyModality: 'daily' });

                // Restore mock.
                spy.mockRestore();
            });

            xit('should reschedule the reminder notification for next week on sunday 19:00 given the study has a weekly task modality', async () => {
                // @todo
            });

        });

    });

});