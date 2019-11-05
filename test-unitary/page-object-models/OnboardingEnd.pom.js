/**
 * @flow
 */

import { render, fireEvent, flushMicrotasksQueue } from 'react-native-testing-library';
import type { Element } from 'react';

import OnboardingEnd from '../../crossplatform-components/Onboarding/OnboardingEndController';

type RenderAPI = $Call<typeof render, Element<OnboardingEnd>>;

class OnboardingEndPageObjectModel {
    renderedObject: RenderAPI;

    constructor(renderedObject: RenderAPI) {
        this.renderedObject = renderedObject;
    }

    // Returns true if the component is currently displayed on screen.
    isDisplayed = (): boolean => {
        // Retrieve root view component.
        const { queryByA11yLabel } = this.renderedObject;
        let rootViewComponent = queryByA11yLabel('onboarding_end');

        // Return whether root view has been found or not.
        return rootViewComponent !== null;
    }

    // Go to the next onboarding step.
    pressNextButton = (): void => {
        // Retrieve the next button.
        const { getByA11yLabel } = this.renderedObject;
        const nextButton = getByA11yLabel('onboarding_end-next');

        // Fire press on it.
        fireEvent.press(nextButton);
    }

    // Await for async callbacks such as settings registration happening once
    // onboarding is done to be finished.
    untilUserHasBeenRegistered = async (): Promise<void> => {
        await flushMicrotasksQueue();
    } 
};

export default OnboardingEndPageObjectModel;