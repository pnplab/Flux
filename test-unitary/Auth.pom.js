/**
 * @flow
 */

import { render, fireEvent } from 'react-native-testing-library';
import type { Element } from 'react';

import Auth from '../crossplatform-components/Onboarding/AuthController';

type RenderAPI = $Call<typeof render, Element<Auth>>;

class AuthPOM {
    renderedObject: RenderAPI;

    constructor(renderedObject: RenderAPI) {
        this.renderedObject = renderedObject;
    }
    
    setDeviceId = (deviceId: string): void => {
        const { getByA11yLabel } = this.renderedObject;
        const deviceIdField = getByA11yLabel('auth-deviceid');
        fireEvent.changeText(deviceIdField, deviceId);
    }

    setPassword = (password: string): void => {
        const { getByA11yLabel } = this.renderedObject;
        const passwordField = getByA11yLabel('auth-password');
        fireEvent.changeText(passwordField, password);
    };

    submit = (): void => {
        const { getByA11yLabel } = this.renderedObject;
        const submitButton = getByA11yLabel('auth-submit');
        fireEvent.press(submitButton);
    };

};

export default AuthPOM;