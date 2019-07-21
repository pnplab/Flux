/**
 * @flow
 */

import 'react-native';
import React from 'react';
import Menu from '../crossplatform-components/Menu';
import Home from '../crossplatform-components/Home';

import { render } from 'react-native-testing-library';

describe('Home', () => {
    
    it('should display the menu', () => {
        const menu =
            <Menu activeButton={'home'} onButtonClicked={jest.fn()} />;
        const home =
            <Home
                studyModality={'daily'}
                lastSubmittedSurveyTimestamp={undefined}
                lastSubmittedRestingStateTaskTimestamp={undefined}
                onStartSurveyTask={jest.fn()}
                onStartRestingStateTask={jest.fn()}

                menuComponent={menu}
            />;
        
        // When the home component is displayed.
        const { queryByA11yLabel } = render(home);

        // Then it should display the menu.
        const displayedComponent = queryByA11yLabel('menu');
        expect(displayedComponent).toEqual(expect.anything());
    });

});