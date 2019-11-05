/**
 * @flow
 */

import { render, fireEvent } from 'react-native-testing-library';
import type { Element } from 'react';

import CheckWifi from '../../crossplatform-components/Onboarding/CheckWifiController';

type RenderAPI = $Call<typeof render, Element<CheckWifi>>;

class CheckWifiPageObjectModel {
    renderedObject: RenderAPI;

    constructor(renderedObject: RenderAPI) {
        this.renderedObject = renderedObject;
    }

    // Returns true if the component is currently displayed on screen.
    isDisplayed = (): boolean => {
        // Retrieve root view component.
        const { queryByA11yLabel } = this.renderedObject;
        let rootViewComponent = queryByA11yLabel('checkwifi');

        // Return whether root view has been found or not.
        return rootViewComponent !== null;
    }

    // Check if wifi is enabled.
    isWifiEnabled = (): boolean => {
        // The wifi is always enabled (this is mocked as such in our
        // @react-native-community/react-native-netinfo mock).
        return true;
    }

    // Wait for wifi to be enabled.
    untilNextButtonAppears = async (): Promise<void> => {
        // ...no need to do anything, given the wifi is already enabled (cf.
        // isWifiEnabled).
    }

    // Go to the next onboarding step.
    pressNextButton = (): void => {
        // Retrieve the next button.
        const { getByA11yLabel } = this.renderedObject;
        const nextButton = getByA11yLabel('checkwifi-next');

        // Fire press on it.
        fireEvent.press(nextButton);
    }

};

export default CheckWifiPageObjectModel;