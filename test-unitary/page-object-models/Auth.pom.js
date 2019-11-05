/**
 * @flow
 */

import { render, fireEvent, flushMicrotasksQueue } from 'react-native-testing-library';
import type { Element } from 'react';

import Auth from '../../crossplatform-components/Onboarding/AuthController';

type RenderAPI = $Call<typeof render, Element<Auth>>;

class AuthPageObjectModel {
    renderedObject: RenderAPI;

    constructor(renderedObject: RenderAPI) {
        this.renderedObject = renderedObject;
    }
    
    // Returns true if the component is currently displayed on screen.
    isDisplayed = (): boolean => {
        // Retrieve root view component.
        const { queryByA11yLabel } = this.renderedObject;
        let rootViewComponent = queryByA11yLabel('auth');

        // Return whether root view has been found or not.
        return rootViewComponent !== null;
    }

    // Type device id.
    typeDeviceId = (deviceId: string): void => {
        const { getByA11yLabel } = this.renderedObject;
        const deviceIdField = getByA11yLabel('auth-deviceid');
        fireEvent.changeText(deviceIdField, deviceId);
    }

    // Type password.
    typePassword = (password: string): void => {
        const { getByA11yLabel } = this.renderedObject;
        const passwordField = getByA11yLabel('auth-password');
        fireEvent.changeText(passwordField, password);
    }

    // Depending on entered password, register user or launch test scenario
    // (bypassing onboarding/aware/...) then go to the next step.
    pressSubmit = (): void => {
        const { getByA11yLabel } = this.renderedObject;
        const submitButton = getByA11yLabel('auth-submit');
        fireEvent.press(submitButton);
    }

    // Wait until component's callback props (such as settings registration)
    // have finished.
    untilAuthentificationHasBeenDone = async (): Promise<void> => {
        await flushMicrotasksQueue();
    }

};

export default AuthPageObjectModel;