/**
 * @flow
 */

import { View } from 'react-native';
import React from 'react';
import Menu from '../crossplatform-components/Menu';
import Home from '../crossplatform-components/Home';

import { render } from 'react-native-testing-library';

describe('<Home>', () => {

    it('should throw if study modality is not set to either daily or weekly', () => {
        let renderFn;
        
        // Given daily study modality.
        renderFn = () => {
            render(
                <Home
                    studyModality={'daily'}
                    lastSubmittedSurveyTimestamp={undefined}
                    lastSubmittedRestingStateTaskTimestamp={undefined}
                    onStartSurveyTask={jest.fn()}
                    onStartRestingStateTask={jest.fn()}

                    menuComponent={<View />}
                />
            );
        };

        // Then it should not throw.
        expect(renderFn).not.toThrow();

        // Given weekly study modality.
        renderFn = () => {
            render(
                <Home
                    studyModality={'weekly'}
                    lastSubmittedSurveyTimestamp={undefined}
                    lastSubmittedRestingStateTaskTimestamp={undefined}
                    onStartSurveyTask={jest.fn()}
                    onStartRestingStateTask={jest.fn()}

                    menuComponent={<View />}
                />
            );
        };
        
        // Then it should not throw.
        expect(renderFn).not.toThrow();

        // Hide react-native's console.error warning about uncaught thrown
        // exceptions.
        jest.spyOn(console, 'error');
        global.console.error.mockImplementation(() => { })

        // Given unexpected study modality (anything else than daily or weekly).
        renderFn = () => {
            render(
                <Home
                    studyModality={'unexisting-modality'}
                    lastSubmittedSurveyTimestamp={undefined}
                    lastSubmittedRestingStateTaskTimestamp={undefined}
                    onStartSurveyTask={jest.fn()}
                    onStartRestingStateTask={jest.fn()}

                    menuComponent={<View />}
                />
            );
        };
        
        // Then it should throw.
        expect(renderFn).toThrow();

        // Restore console.error function.
        global.console.error.mockRestore();
    });
    
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