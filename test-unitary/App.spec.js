/**
 * @flow
 * @format
 * 
 * We need to test App rendering because testing on emulator fails:
 * Indeed, js debugger crashes because of Realm. This makes making mocking
 * absolutely mandatory to be able to use the js debugger.
 * cf. `https://github.com/realm/realm-js/issues/1407#issuecomment-537810328`
 */

import 'react-native';
import moment from 'moment';
import React from 'react';
import App from '../App';
import realm from '../crossplatform-model/persistent-db'; // Only used to reset state.
import UserManager from '../crossplatform-model/persistent-db/UserManager'; // Only used to mock data.
import { STUDY_URL } from '../config'; // this is mocked through config - so true values are in `/test-mocks/config.mock.js` :)

// @note test renderer must be required after react-native.
import { render, flushMicrotasksQueue, debug } from 'react-native-testing-library';

import AuthPOM from './Auth.pom';

// Fixes `ReferenceError: You are trying to `import` a file after the Jest
// environment has been torn down.`. Appearing among other things when using
// animated components (such as somes in `native-base`, so as many places in 
// our interface). see `https://github.com/facebook/jest/issues/4359` and
// `https://github.com/facebook/jest/issues/6434`.
jest.useFakeTimers();

describe('<App>', () => {

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
            // @note A11y stands for Accessibility.
            const { queryByA11yLabel } = render(<App />);

            // Once user settings have been loaded.
            await flushMicrotasksQueue();

            // Then, it should display the onboarding component.
            const displayedComponent = queryByA11yLabel('onboarding-auth');
            expect(displayedComponent).not.toBeUndefined();
            expect(displayedComponent).not.toBeNull();
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
            const { queryByA11yLabel } = render(<App />);

            // Once user settings have been loaded.
            await flushMicrotasksQueue();

            // Then, it should display the home component.
            const displayedComponent = queryByA11yLabel('home-notask');
            expect(displayedComponent).not.toBeUndefined();
            expect(displayedComponent).not.toBeNull();

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
            const { queryByA11yLabel } = render(<App />);

            // Once user settings have been loaded.
            await flushMicrotasksQueue();

            // Then, it should display the home component.
            const displayedComponent = queryByA11yLabel('home-surveytask');
            expect(displayedComponent).not.toBeUndefined();
            expect(displayedComponent).not.toBeNull();

            // Restore date for next tests.
            dateNowMockFn.mockRestore();
        });

    });

    describe('<Onboarding>', () => {

        describe('<Auth>', () => {

            it('should redirect to <Home> when the user authentificates using the `371olh` test-scenario password', async () => {
                try {
                    // Given no user has been setup yet.
                    // ...nothing needs to be set, this is the initial setup.

                    // Given the root component is displayed.
                    const app = render(<App />);
                    const authPOM = new AuthPOM(app);

                    // Once empty user settings have been loaded and <AppLoader>
                    // has redirect the App to the <Auth> component.
                    await flushMicrotasksQueue();

                    // When the user type authentificates with any random device id
                    // and the `371olh` password.
                    authPOM.setDeviceId('testdevice');
                    authPOM.setPassword('371olh');
                    authPOM.submit();

                    // Once user settings have been stored.
                    // await waitForElement(() => app.getByA11yLabel('home'));
                    await flushMicrotasksQueue();
                    // debug.deep(app);

                    // Then user should be redirected to the <Home> component  
                    // instead of continuing through the onboarding process.
                    const home = app.getByA11yLabel('home');
                    expect(home).toEqual(expect.anything());

                    // Then aware should not launched.
                    // @todo
                }
                catch(e) {
                    console.error(e);
                    throw e;
                }
            });

        });

    });


    xit('should enable navigation from Home to Notifications', () => {

    });

    xit('should enable navigation from Notifications to Home', () => {

    });

});
