/**
 * @flow
 */

import { render, flushMicrotasksQueue } from 'react-native-testing-library';
import type { Element } from 'react';

import AppLoader from '../../crossplatform-components/AppLoader';

type RenderAPI = $Call<typeof render, Element<AppLoader>>;

class AppLoaderPageObjectModel {
    renderedObject: RenderAPI;

    constructor(renderedObject: RenderAPI) {
        this.renderedObject = renderedObject;
    }

    // // Returns true if the component is currently displayed on screen.
    // isDisplayed = (): boolean => {
    //     // Retrieve root view component.
    //     const { queryByA11yLabel } = this.renderedObject;
    //     let rootViewComponent = queryByA11yLabel('apploader');

    //     // Return whether root view has been found or not.
    //     return rootViewComponent !== null;
    // }

    // Wait till user settings have been loaded by app loader and the
    // <AppLoader> property callback methods have been called.
    untilAppHasBeenLoaded = async () => {
        // Just awaiting this method will wait till the end of the js event 
        // queue by design (due to async) and thus after the loading of the
        // user settings. Especially since realm is mocked and thus
        // returns result instantaneously (yet still asynchronously through
        // promise).
        
        // @warning EDIT: as a matter of fact, flushMicrotasksQueue is still 
        //     needed for some reason.
        await flushMicrotasksQueue();
    };

};

export default AppLoaderPageObjectModel;