/**
 * @flow
 */

import { render, fireEvent } from 'react-native-testing-library';
import type { Element } from 'react';

import CheckDataSync from '../../crossplatform-components/Onboarding/CheckDataSyncController';

type RenderAPI = $Call<typeof render, Element<CheckDataSync>>;

class CheckDataSyncPageObjectModel {
    renderedObject: RenderAPI;

    constructor(renderedObject: RenderAPI) {
        this.renderedObject = renderedObject;
    }

    // Returns true if the component is currently displayed on screen.
    isDisplayed = (): boolean => {
        // Retrieve root view component.
        const { queryByA11yLabel } = this.renderedObject;
        let rootViewComponent = queryByA11yLabel('check_data_sync');

        // Return whether root view has been found or not.
        return rootViewComponent !== null;
    }

    // Bypass sync step by long pressing the sync button. This has been 
    // developed both to have a fallback (that we don't intent to use) to 
    // bypass the sync process in case of error during patient's onboarding and
    // specifically and temporarily for the current unit tests, instead of 
    // mocking the Aware Sync API.
    longPressSyncButton = (): void => {
        // Retrieve the sync button.
        const { getByA11yLabel } = this.renderedObject;
        const syncButton = getByA11yLabel('check_data_sync-sync');

        // Fire long press on it.
        // @note react-native-testing-library doesn't have longPress helper.
        // native-testing-library does but prevents layered r-n component props
        // access explicitely.
        fireEvent(syncButton, 'longPress');
    };

};

export default CheckDataSyncPageObjectModel;