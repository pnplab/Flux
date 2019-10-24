/**
 * @flow
 */

import 'react-native';
import React from 'react';
import Auth from '../crossplatform-components/Onboarding/AuthController';
import { STUDY_URL } from '../config'; // this is mocked through config - so true values are in `/test-mocks/config.mock.js` :)

// @note test renderer must be required after react-native.
import { render, fireEvent, flushMicrotasksQueue } from 'react-native-testing-library';

// Fixes `ReferenceError: You are trying to `import` a file after the Jest
// environment has been torn down.`. Appearing among other things s when using 
// animated components (such as somes in `native-base`, so as many places in 
// our interface). see `https://github.com/facebook/jest/issues/4359` and
// `https://github.com/facebook/jest/issues/6434`.
jest.useFakeTimers();

describe.only('Onboarding Auth Step', () => {

    it('should trigger onAuthSucceeded with daily study modality given the right password', () => {
        // Render the Auth component.
        // render(<Auth />);

    });

    it('should trigger onAuthSucceeded with weekly study modality given the right password', () => {
        // Given the Auth component has been rendered with onAuthSucceded mock.
        const onAuthSucceded = jest.fn();
        const { getByA11yLabel } = render(<Auth onAuthSucceded={onAuthSucceded} />);
        
        // Given the following study setup.
        const dailyStudyModality = 'daily';
        const dailyStudyPassword = '4wc2uw';
        const dailyStudyAwareStudyUrl = STUDY_URL;
        
        // When the user type the mandatory user id.
        const deviceId = 'mydeviceid';
        const deviceIdField = getByA11yLabel('auth-deviceid');
        fireEvent.changeText(deviceIdField, deviceId);

        // When the user type `4wc2uw` password.
        const passwordField = getByA11yLabel('auth-password');
        fireEvent.changeText(deviceIdField, dailyStudyPassword);

        // When the user click on auth button.
        const submitButton = getByA11yLabel('auth-submit');
        fireEvent.press(submitButton);
        
        // Then the callback is triggered with the appropriate parameters.
        expect(onAuthSucceded).toHaveBeenCalledWith(
            dailyStudyModality,
            deviceId,
            dailyStudyAwareStudyUrl
        );
    });

    it('should trigger onTestAuthSucceeded given the right password', () => {

    });

});