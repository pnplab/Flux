/**
 * @flow
 */

import { render } from 'react-native-testing-library';
import type { Element } from 'react';

import Home from '../../crossplatform-components/Home';

type RenderAPI = $Call<typeof render, Element<Home>>;

class HomePageObjectModel {
    renderedObject: RenderAPI;

    constructor(renderedObject: RenderAPI) {
        this.renderedObject = renderedObject;
    }

    // Returns true if the component is currently displayed on screen.
    isDisplayed = (): boolean => {
        // Retrieve root view component.
        const { queryByA11yLabel } = this.renderedObject;
        let rootViewComponent = queryByA11yLabel('home');

        // Return whether root view has been found or not.
        return rootViewComponent !== null;
    }
    
    // Returns true if the component is currently not suggesting any task.
    isSuggestingNoTask = (): boolean => {
        // Retrieve home w/ no task view component.
        const { queryByA11yLabel } = this.renderedObject;
        let noTaskViewComponent = queryByA11yLabel('home-notask');

        // Return whether view has been found or not.
        return noTaskViewComponent !== null;
    }

    // Returns true if the component is currently suggesting the user to do a
    // survey task.
    isSuggestingSurveyTask = (): boolean => {
        // Retrieve home w/ no task view component.
        const { queryByA11yLabel } = this.renderedObject;
        let surveyTaskViewComponent = queryByA11yLabel('home-surveytask');

        // Return whether view has been found or not.
        return surveyTaskViewComponent !== null;
    }

    // Returns true if the component is currently suggesting the user to do a
    // resting state task.
    isSuggestingRestingStateTask = (): boolean => {
        // Retrieve home w/ resting state task suggestion view component.
        const { queryByA11yLabel } = this.renderedObject;
        let restingStateTaskViewComponent = queryByA11yLabel('home-restingstatetask');

        // Return whether view has been found or not.
        return restingStateTaskViewComponent !== null;
    }

}

export default HomePageObjectModel;