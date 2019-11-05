/**
 * @flow
 */

import 'react-native';
import React from 'react';
import Auth from '../../crossplatform-components/Onboarding/AuthController';
import AuthPOM from '../page-object-models/auth.pom';
import { STUDY_URL } from '../../config'; // this is mocked through config - so true values are in `/test-mocks/config.mock.js` :)

// @note test renderer must be required after react-native.
import { render, flushMicrotasksQueue } from 'react-native-testing-library';

// Fixes `ReferenceError: You are trying to `import` a file after the Jest
// environment has been torn down.`. Appearing among other things when using
// animated components (such as somes in `native-base`, so as many places in
// our interface). see `https://github.com/facebook/jest/issues/4359` and
// `https://github.com/facebook/jest/issues/6434`.
jest.useFakeTimers();

describe('task scheduling', () => {

    describe('<Auth> (onboarding step)', () => {

        afterEach(async () => {
            // Wait for promises to end after each test. This is not relevant in
            // the current scenario but helps the code coverage green out ending
            // `break;` statement lines located just after `await` ones.
            await flushMicrotasksQueue();
        });

        it('should throw given invalid properties', () => {
            // Hide react-native's console.error warning about uncaught thrown
            // exceptions.
            jest.spyOn(console, 'error');
            global.console.error.mockImplementation(() => { });

            // Component without onAuthSucceeded parameter should throw.
            expect(() => {
                // $flow-disable-line
                render(<Auth />);
            }).toThrow();

            // Component with wrong onAuthSucceeded parameter should throw.
            expect(() => {
                // $flow-disable-line
                render(<Auth onAuthSucceeded={'string'} />);
            }).toThrow();

            // Restore console.error function.
            global.console.error.mockRestore();
        });

        it('should not throw given proper properities', () => {
            // Component with onAuthSucceeded parameter should not throw.
            expect(() => {
                render(<Auth onAuthSucceeded={jest.fn()} />);
            }).not.toThrow();
        });

        it('should trigger onAuthSucceeded with daily study modality given `4wc2uw` study password', () => {
            // Given <Auth> has been rendered with `onAuthSucceeded` mock.
            const onAuthSucceeded = jest.fn();
            const auth = render(<Auth onAuthSucceeded={onAuthSucceeded} />);
            const authPOM = new AuthPOM(auth);

            // When the user types a random mandatory user id.
            authPOM.typeDeviceId('mydeviceid');

            // When the user types `4wc2uw` password.
            authPOM.typePassword('4wc2uw');

            // When the user clicks on the authentification button.
            authPOM.pressSubmit();

            // Then onAuthSucceeded is triggered with the appropriate study settings.
            expect(onAuthSucceeded).toHaveBeenCalledWith(
                'daily',
                'mydeviceid',
                STUDY_URL
            );
        });

        it('should trigger onAuthSucceeded with weekly study modality given the `f32bts` study password', () => {
            // Given <Auth> has been rendered with `onAuthSucceeded` mock.
            const onAuthSucceeded = jest.fn();
            const auth = render(<Auth onAuthSucceeded={onAuthSucceeded} />);
            const authPOM = new AuthPOM(auth);

            // When the user types a random mandatory user id.
            authPOM.typeDeviceId('mydeviceid');

            // When the user types `4wc2uw` password.
            authPOM.typePassword('f32bts');

            // When the user clicks on the authentification button.
            authPOM.pressSubmit();

            // Then onAuthSucceeded is triggered with the appropriate parameters.
            expect(onAuthSucceeded).toHaveBeenCalledWith(
                'weekly',
                'mydeviceid',
                STUDY_URL
            );
        });

        it('should trigger onStartTest given the `371olh` test-scenario password', () => {
            // Given <Auth> has been rendered with `onAuthSucceeded` and
            // `onStartTest` mocks.
            const onAuthSucceeded = jest.fn();
            const onStartTest = jest.fn();
            const auth = render(<Auth onAuthSucceeded={onAuthSucceeded} onStartTest={onStartTest} />);
            const authPOM = new AuthPOM(auth);

            // When the user types a random mandatory user id.
            authPOM.typeDeviceId('mydeviceid');

            // When the user types `371olh` password.
            authPOM.typePassword('371olh');

            // When the user clicks on the authentification button.
            authPOM.pressSubmit();

            // Then onAuthSucceeded should not have been called.
            expect(onAuthSucceeded).not.toHaveBeenCalled();

            // Then onStartTest should have been called.
            expect(onStartTest).toHaveBeenCalled();

            // Then onStartTest should have been called with the deviceId as a
            // parameter.
            expect(onStartTest).toHaveBeenCalledWith('mydeviceid');
        });

    });

});