/**
 * @flow
 */

import { render, fireEvent } from 'react-native-testing-library';
import type { Element } from 'react';

import OnboardingSurveyTask from '../../crossplatform-components/Onboarding/OnboardingSurveyTaskController';

type RenderAPI = $Call<typeof render, Element<OnboardingSurveyTask>>;

class OnboardingSurveyTaskPageObjectModel {
    renderedObject: RenderAPI;

    constructor(renderedObject: RenderAPI) {
        this.renderedObject = renderedObject;
    }

    // Returns true if the component is currently displayed on screen.
    isDisplayed = (): boolean => {
        // Retrieve root view component.
        const { queryByA11yLabel } = this.renderedObject;
        let rootViewComponent = queryByA11yLabel('onboarding_surveytask');

        // Return whether root view has been found or not.
        return rootViewComponent !== null;
    }

    // Bypass the task by long pressing the start task button. This has been
    // developed in order to simplify testing. Especially because of issues
    // scrolling through the question list with appium e2e.
    longPressStartTaskButton = (): void => {
        // Retrieve the start task button.
        const { getByA11yLabel } = this.renderedObject;
        const startTaskButton = getByA11yLabel('onboarding_surveytask-start_task');

        // Fire long press on it.
        // @note react-native-testing-library doesn't have longPress helper.
        // native-testing-library does but prevents layered r-n component props
        // access explicitely.
        fireEvent(startTaskButton, 'longPress');
    };
};

export default OnboardingSurveyTaskPageObjectModel;