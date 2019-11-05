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
import moment from 'moment';
import React from 'react';
import App from '../../App';
import realm from '../../crossplatform-model/persistent-db'; // Only used to reset state.
import UserManager from '../../crossplatform-model/persistent-db/UserManager'; // Only used to mock data.
import { STUDY_URL } from '../../config'; // This is mocked through config - so true values are in `/test-mocks/config.mock.js` :)

// @note test renderer must be required after react-native.
// @note A11y stands for Accessibility.
import { render, flushMicrotasksQueue } from 'react-native-testing-library';

import * as pom from '../page-object-models';

// Fixes `ReferenceError: You are trying to `import` a file after the Jest
// environment has been torn down.`. Appearing among other things when using
// animated components (such as somes in `native-base`, so as many places in
// our interface). see `https://github.com/facebook/jest/issues/4359` and
// `https://github.com/facebook/jest/issues/6434`.
jest.useFakeTimers();

describe('navigation', () => {

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

        it('shouldn\'t throw when rendered', async () => {
            // Render the root component.
            render(<App />);

            // Wait till the end of the js event queue and thus the end of all
            // resolved promises. Especially the one that checks whether user has
            // yet been registered or not (so we redirect to onboarding or to Home
            // controller). We already use fake time and have mocked realm so the
            // related promise have been resolved instantaneously!
            await flushMicrotasksQueue(); // probably similar to `await Promise.resolve();`.

            // If no error has been thrown yet, we're on the right track :-)
            expect(true);
        });

        describe('<AppLoader>', () => {

            it('should redirect to <Onboarding> if the user has not yet been register', async () => {
                // Given user has not been registered yet.
                // ...nothing needs to be set, this is the initial setup.

                // When the root component is displayed.
                const app = render(<App />);

                // Once app has been loaded (user settings have been loaded).
                const appLoader = new pom.AppLoader(app);
                await appLoader.untilAppHasBeenLoaded();

                // Then, it should display the onboarding component.
                const onboarding = new pom.Onboarding(app);
                expect(onboarding.isDisplayed()).toBeTruthy();
            });

            it('should redirect to <Home> (no task suggested) if the user has been registered (and we\'re out of the task schedule)', async () => {
                // Given we're outside task schedule.
                const outOfTaskScheduleMsTimestamp = moment('2019-05-17 13:00', 'YYYY-MM-DD HH:mm').valueOf();
                const dateNowMockFn = jest
                    .spyOn(Date, 'now')
                    .mockImplementation(
                        () => outOfTaskScheduleMsTimestamp
                    );

                // Given user has already been registered.
                await UserManager.setupUser('daily', 'TEST_DEVICE_ID', STUDY_URL);

                // When the root component is displayed.
                const app = render(<App />);

                // Once app has been loaded (user settings have been loaded).
                const appLoader = new pom.AppLoader(app);
                await appLoader.untilAppHasBeenLoaded();

                // Then, it should display the home component and suggest no task.
                const home = new pom.Home(app);
                expect(home.isDisplayed()).toBeTruthy();
                expect(home.isSuggestingNoTask()).toBeTruthy();

                // Restore date for next tests.
                dateNowMockFn.mockRestore();
            });

            it('should redirect to <Home> (survey task suggested) if the user has been registered (and we\'re inside the task schedule)', async () => {
                // Given we're outside task schedule.
                const withinTaskScheduleMsTimestamp = moment('2019-05-21 19:15', 'YYYY-MM-DD HH:mm').valueOf();
                const dateNowMockFn = jest
                    .spyOn(Date, 'now')
                    .mockImplementation(
                        () => withinTaskScheduleMsTimestamp
                    );

                // Given user has already been registered.
                await UserManager.setupUser('daily', 'TEST_DEVICE_ID', STUDY_URL);

                // When the root component is displayed.
                const app = render(<App />);

                // Once app has been loaded (user settings have been loaded).
                const appLoader = new pom.AppLoader(app);
                await appLoader.untilAppHasBeenLoaded();

                // Then, it should display the home component.
                const home = new pom.Home(app);
                expect(home.isDisplayed()).toBeTruthy();
                expect(home.isSuggestingSurveyTask()).toBeTruthy();

                // Restore date for next tests.
                dateNowMockFn.mockRestore();
            });

        });

        describe('<Onboarding>', () => {

            describe('<Auth>', () => {

                it('should redirect to <Home> when the user authentificates using the `371olh` test-scenario password', async () => {
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

                    // Then user should be redirected to the <Home> component
                    // instead of continuing through the onboarding process.
                    const home = app.getByA11yLabel('home');
                    expect(home).toEqual(expect.anything());

                    // Then aware should not launched.
                    // @todo
                });

                it('should go to the <CheckWifi> onboarding step when the user authentificates using the `4wc2uw` password', async () => {
                    // Given no user has been setup yet.
                    // ...nothing needs to be set, this is the initial setup.

                    // Given the root component is displayed.
                    const app = render(<App />);

                    // Once empty user settings have been loaded and <AppLoader>
                    // has redirect the App to the <Auth> component.
                    const appLoader = new pom.AppLoader();
                    await appLoader.untilAppHasBeenLoaded();

                    // When the user authentificates with any random device id and
                    // the `4wc2uw` password.
                    const onboarding = new pom.Onboarding(app);
                    await onboarding.auth('testdevice', '4wc2uw');

                    // Then user should be redirected to the <CheckWifi> component
                    // of the onboarding process.
                    const checkWifi = app.getByA11yLabel('checkwifi');
                    expect(checkWifi).toEqual(expect.anything());
                });

                it('should go to the <CheckWifi> onboarding step when the user authentificates using the `f32bts` password', async () => {
                    // Given no user has been setup yet.
                    // ...nothing needs to be set, this is the initial setup.

                    // Given the root component is displayed.
                    const app = render(<App />);

                    // Once empty user settings have been loaded and <AppLoader>
                    // has redirect the App to the <Auth> component.
                    const appLoader = new pom.AppLoader();
                    await appLoader.untilAppHasBeenLoaded();

                    // When the user authentificates with any random device id and
                    // the `f32bts` password.
                    const onboarding = new pom.Onboarding(app);
                    await onboarding.auth('testdevice', 'f32bts');

                    // Then user should be redirected to the <CheckWifi> component
                    // of the onboarding process.
                    const checkWifi = app.getByA11yLabel('checkwifi');
                    expect(checkWifi).toEqual(expect.anything());
                });

            });

            describe('<CheckWifi>', () => {

                it('should go to the <CheckPermissions> onboarding step next', async () => {
                    // Given no user has been setup yet.
                    // ...nothing needs to be set, this is the initial setup.

                    // Given the root component is displayed.
                    const app = render(<App />);

                    // Once empty user settings have been loaded and <AppLoader>
                    // has redirect the App to the <Auth> component.
                    const appLoader = new pom.AppLoader();
                    await appLoader.untilAppHasBeenLoaded();

                    // When the user authentificates with any random device id and
                    // the `f32bts` password.
                    const onboarding = new pom.Onboarding(app);
                    await onboarding.auth('testdevice', 'f32bts');

                    // When the user goes through the check wifi stage.
                    await onboarding.checkWifi();

                    // Then user should be redirected to the <CheckPermissions>
                    // component of the onboarding process.
                    const checkPermissions = app.getByA11yLabel('checkpermissions');
                    expect(checkPermissions).toEqual(expect.anything());
                });

            });

            describe('<CheckPermissions>', () => {

                it('should go to the <CheckPhenotyping> onboarding step next', async () => {
                    // Given no user has been setup yet.
                    // ...nothing needs to be set, this is the initial setup.

                    // Given the root component is displayed.
                    const app = render(<App />);

                    // Once empty user settings have been loaded and <AppLoader>
                    // has redirect the App to the <Auth> component.
                    const appLoader = new pom.AppLoader();
                    await appLoader.untilAppHasBeenLoaded();

                    // When the user authentificates with any random device id and
                    // the `f32bts` password.
                    const onboarding = new pom.Onboarding(app);
                    await onboarding.auth('testdevice', 'f32bts');

                    // When the user goes through the check wifi stage.
                    await onboarding.checkWifi();

                    // When the user goes through the check permission stage.
                    await onboarding.checkPermissions();

                    // Then user should be redirected to the <CheckPhenotyping> component
                    // of the onboarding process.
                    const checkPhenotyping = app.getByA11yLabel('checkphenotyping');
                    expect(checkPhenotyping).toEqual(expect.anything());
                });

            });

            describe('<CheckPhenotyping>', () => {

                it('should go to the <SurveyTaskOnboarding> onboarding step next', async () => {
                    // Given no user has been setup yet.
                    // ...nothing needs to be set, this is the initial setup.

                    // Given the root component is displayed.
                    const app = render(<App />);

                    // Once empty user settings have been loaded and <AppLoader>
                    // has redirect the App to the <Auth> component.
                    const appLoader = new pom.AppLoader();
                    await appLoader.untilAppHasBeenLoaded();

                    // When the user authentificates with any random device id and
                    // the `f32bts` password.
                    const onboarding = new pom.Onboarding(app);
                    await onboarding.auth('testdevice', 'f32bts');

                    // When the user goes through the check wifi stage.
                    await onboarding.checkWifi();

                    // When the user goes through the check permission stage.
                    await onboarding.checkPermissions();

                    // When the user goes through the check phenotyping / start
                    // aware stage.
                    await onboarding.checkPhenotyping();

                    // Then user should be redirected to <SurveyTaskOnboarding>
                    // component of the onboarding process.
                    const surveyTaskOnboarding = app.getByA11yLabel('onboarding_surveytask');
                    expect(surveyTaskOnboarding).toEqual(expect.anything());
                });

            });

            describe('<SurveyTaskOnboarding>', () => {

                it('should bypass task and go to the <RestingStateTaskOnboarding> onboarding step when the user long presses on start task button', async () => {
                    // Given no user has been setup yet.
                    // ...nothing needs to be set, this is the initial setup.

                    // Given the root component is displayed.
                    const app = render(<App />);

                    // Once empty user settings have been loaded and <AppLoader>
                    // has redirect the App to the <Auth> component.
                    const appLoader = new pom.AppLoader();
                    await appLoader.untilAppHasBeenLoaded();

                    // When the user authentificates with any random device id and
                    // the `f32bts` password.
                    const onboarding = new pom.Onboarding(app);
                    await onboarding.auth('testdevice', 'f32bts');

                    // When the user goes through the check wifi stage.
                    await onboarding.checkWifi();

                    // When the user goes through the check permission stage.
                    await onboarding.checkPermissions();

                    // When the user goes through the check phenotyping / start
                    // aware stage.
                    await onboarding.checkPhenotyping();

                    // When the user goes through the onboarding survey task stage.
                    await onboarding.bypassSurveyTask();

                    // Then user should be redirected to <RestingStateTaskOnboarding>
                    // component of the onboarding process.
                    const restingStateTaskOnboarding = app.getByA11yLabel('onboarding_restingstatetask');
                    expect(restingStateTaskOnboarding).toEqual(expect.anything());
                });

            });

            describe('<RestingStateTaskOnboarding>', () => {

                it('should bypass task and go to the <CheckDataSync> onboarding step when the user long presses on start task button', async () => {
                    // Given no user has been setup yet.
                    // ...nothing needs to be set, this is the initial setup.

                    // Given the root component is displayed.
                    const app = render(<App />);

                    // Once empty user settings have been loaded and <AppLoader>
                    // has redirect the App to the <Auth> component.
                    const appLoader = new pom.AppLoader();
                    await appLoader.untilAppHasBeenLoaded();

                    // When the user authentificates with any random device id and
                    // the `f32bts` password.
                    const onboarding = new pom.Onboarding(app);
                    await onboarding.auth('testdevice', 'f32bts');

                    // When the user goes through the check wifi stage.
                    await onboarding.checkWifi();

                    // When the user goes through the check permission stage.
                    await onboarding.checkPermissions();

                    // When the user goes through the check phenotyping / start
                    // aware stage.
                    await onboarding.checkPhenotyping();

                    // When the user goes through the onboarding survey task stage.
                    await onboarding.bypassSurveyTask();

                    // When the user goes through the onboarding resting state task
                    // stage.
                    await onboarding.bypassRestingStateTask();

                    // Then user should be redirected to <CheckDataSync> component
                    // of the onboarding process.
                    const checkDataSync = app.getByA11yLabel('check_data_sync');
                    expect(checkDataSync).toEqual(expect.anything());
                });
            });

            describe('<CheckDataSync>', () => {

                it('should go to the <OnboardingEnd> onboarding step when the user presses on the next step button', async () => {
                    // Given no user has been setup yet.
                    // ...nothing needs to be set, this is the initial setup.

                    // Given the root component is displayed.
                    const app = render(<App />);

                    // Once empty user settings have been loaded and <AppLoader>
                    // has redirect the App to the <Auth> component.
                    const appLoader = new pom.AppLoader();
                    await appLoader.untilAppHasBeenLoaded();

                    // When the user authentificates with any random device id and
                    // the `f32bts` password.
                    const onboarding = new pom.Onboarding(app);
                    await onboarding.auth('testdevice', 'f32bts');

                    // When the user goes through the check wifi stage.
                    await onboarding.checkWifi();

                    // When the user goes through the check permission stage.
                    await onboarding.checkPermissions();

                    // When the user goes through the check phenotyping / start
                    // aware stage.
                    await onboarding.checkPhenotyping();

                    // When the user goes through the onboarding survey task stage.
                    await onboarding.bypassSurveyTask();

                    // When the user goes through the onboarding resting state task
                    // stage.
                    await onboarding.bypassRestingStateTask();

                    // When the user goes through the check data sync stage.
                    await onboarding.bypassCheckDataSync();

                    // Then user should be redirected to <OnboardingEnd>, the last
                    // component of the onboarding process.
                    const onboardingEnd = app.getByA11yLabel('onboarding_end');
                    expect(onboardingEnd).toEqual(expect.anything());
                });

            });


            describe('<OnboardingEnd>', () => {

                it('should go to the <Home> view when the user presses on the next step button', async () => {
                    // Given no user has been setup yet.
                    // ...nothing needs to be set, this is the initial setup.

                    // Given the root component is displayed.
                    const app = render(<App />);

                    // Once empty user settings have been loaded and <AppLoader>
                    // has redirect the App to the <Auth> component.
                    const appLoader = new pom.AppLoader();
                    await appLoader.untilAppHasBeenLoaded();

                    // When the user authentificates with any random device id and
                    // the `f32bts` password.
                    const onboarding = new pom.Onboarding(app);
                    await onboarding.auth('testdevice', 'f32bts');

                    // When the user goes through the check wifi stage.
                    await onboarding.checkWifi();

                    // When the user goes through the check permission stage.
                    await onboarding.checkPermissions();

                    // When the user goes through the check phenotyping / start
                    // aware stage.
                    await onboarding.checkPhenotyping();

                    // When the user goes through the onboarding survey task stage.
                    await onboarding.bypassSurveyTask();

                    // When the user goes through the onboarding resting state task
                    // stage.
                    await onboarding.bypassRestingStateTask();

                    // When the user goes through the check data sync stage.
                    await onboarding.bypassCheckDataSync();

                    // When the user goes through the onboarding final stage.
                    await onboarding.finish();

                    // Then user should be redirected to the <Home> component.
                    const home = app.getByA11yLabel('home');
                    expect(home).toEqual(expect.anything());
                });

            });

        });

    });

});