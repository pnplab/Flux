/**
 * @flow
 */

import { render, fireEvent, flushMicrotasksQueue } from 'react-native-testing-library';
import type { Element } from 'react';

import CheckPhenotyping from '../../crossplatform-components/Onboarding/CheckPhenotypingController';

type RenderAPI = $Call<typeof render, Element<CheckPhenotyping>>;

class CheckPhenotypingPageObjectModel {
    renderedObject: RenderAPI;

    constructor(renderedObject: RenderAPI) {
        this.renderedObject = renderedObject;
    }

    // Returns true if the component is currently displayed on screen.
    isDisplayed = (): boolean => {
        // Retrieve root view component.
        const { queryByA11yLabel } = this.renderedObject;
        let rootViewComponent = queryByA11yLabel('checkphenotyping');

        // Return whether root view has been found or not.
        return rootViewComponent !== null;
    }

    // Start aware (does nothing has aware is mocked).
    pressStartAwareButton = (): void => {
        // Retrieve the start aware button.
        const { getByA11yLabel } = this.renderedObject;
        const startAwareButton = getByA11yLabel('checkphenotyping-startaware');

        // Fire press on it.
        fireEvent.press(startAwareButton);
    }

    // Wait for aware to have been loaded.
    untilNextButtonAppears = async (): Promise<void> => {
        // ...no need to do anything, given aware starts instantaneously in
        // unit tests due to our AwareManager mock.
        // Just awaiting this method will wait till the end of the js event 
        // queue by design and thus after the loading of aware.
        
        // @warning EDIT: actually the following is still required for some
        //     reason.
        await flushMicrotasksQueue();
    }

    // Go to the next onboarding step.
    pressNextButton = (): void => {
        // Retrieve the next button.
        const { getByA11yLabel } = this.renderedObject;
        const nextButton = getByA11yLabel('checkphenotyping-next');

        // Fire press on it.
        fireEvent.press(nextButton);
    }

};

export default CheckPhenotypingPageObjectModel;