/**
 * @flow
 */

import { render, fireEvent } from 'react-native-testing-library';
import type { Element } from 'react';

import OnboardingRestingStateTask from '../../crossplatform-components/Onboarding/OnboardingRestingStateTaskController';

type RenderAPI = $Call<typeof render, Element<OnboardingRestingStateTask>>;

class OnboardingRestingStateTaskPageObjectModel {
    renderedObject: RenderAPI;

    constructor(renderedObject: RenderAPI) {
        this.renderedObject = renderedObject;
    }

    // Returns true if the component is currently displayed on screen.
    isDisplayed = (): boolean => {
        // Retrieve root view component.
        const { queryByA11yLabel } = this.renderedObject;
        let rootViewComponent = queryByA11yLabel('onboarding_restingstatetask');

        // Return whether root view has been found or not.
        return rootViewComponent !== null;
    }

    // Bypass the task by long pressing the start task button. This has been
    // developed because Muse devices can not be available through aws
    // devicefarm remote testing.
    longPressStartTaskButton = (): void => {
        // Retrieve the start task button.
        const { getByA11yLabel } = this.renderedObject;
        const startTaskButton = getByA11yLabel('onboarding_restingstatetask-start_task');

        // Fire long press on it.
        // @note react-native-testing-library doesn't have longPress helper.
        // native-testing-library does but prevents layered r-n component props
        // access explicitely.
        fireEvent(startTaskButton, 'longPress');
    };
}

export default OnboardingRestingStateTaskPageObjectModel;