/**
 * @flow
 */

import { render, fireEvent, flushMicrotasksQueue } from 'react-native-testing-library';
import type { Element } from 'react';

import CheckPermissions from '../../crossplatform-components/Onboarding/CheckPermissionsController';

type RenderAPI = $Call<typeof render, Element<CheckPermissions>>;

class CheckPermissionsPageObjectModel {
    renderedObject: RenderAPI;

    constructor(renderedObject: RenderAPI) {
        this.renderedObject = renderedObject;
    }

    // Returns true if the component is currently displayed on screen.
    isDisplayed = (): boolean => {
        // Retrieve root view component.
        const { queryByA11yLabel } = this.renderedObject;
        let rootViewComponent = queryByA11yLabel('checkpermissions');

        // Return whether root view has been found or not.
        return rootViewComponent !== null;
    }

    // Wait for android permission status to have been loaded.
    untilNextButtonAppears = async (): Promise<void> => {
        // ...no need to do anything, given permissions are already granted 
        // (this is mocked as such in our PermissionsAndroid mock).
        // Just awaiting this method will wait till the end of the js event 
        // queue by design (due to async) and thus after the loading of the
        // permission status.

        // @warning EDIT: actually the following is still required for some
        //     reason.
        await flushMicrotasksQueue();
    }

    // Go to the next onboarding step.
    pressNextButton = (): void => {
        // Retrieve next button.
        const { getByA11yLabel } = this.renderedObject;
        const nextButton = getByA11yLabel('checkpermissions-next');

        // Fire press on it.
        fireEvent.press(nextButton);
    };

};

export default CheckPermissionsPageObjectModel;