/**
 * @flow
 */

import 'react-native';
import React from 'react';
import Menu from '../crossplatform-components/Menu';

// @note test renderer must be required after react-native.
import { render, fireEvent } from 'react-native-testing-library';

describe('Menu', () => {

    it('should not throw given correct attributes', async () => {
        // Render the Menu component.
        render(<Menu activeButton={'home'} onButtonClicked={jest.fn()} />);

        // If no error has been thrown yet, we're on the right track :-)
        expect(true);
    });

    it('should throw given incorrect attributes', async () => {
        // Hide react-native's console.error warning about uncaught thrown
        // exceptions.
        jest.spyOn(console, 'error');
        global.console.error.mockImplementation(() => { })

        // Render the Menu component without attribute.
        expect(() => {
            render(<Menu />);
        }).toThrow();

        // Render the Menu component with undefined activeButton.
        expect(() => {
            render(<Menu activeButton={undefined} onButtonClicked={jest.fn()} />);
        }).toThrow();

        // Render the Menu component with typo in activeButton.
        expect(() => {
            render(<Menu activeButton={'homem'} onButtonClicked={jest.fn()} />);
        }).toThrow();

        // Render the Menu component with callback not being a function.
        expect(() => {
            render(<Menu activeButton={'home'} onButtonClicked={'notafunction'} />);
        }).toThrow();

        // Restore console.error function.
        global.console.error.mockRestore();
    });

    it('should display the 4 buttons', () => {
        // Given the menu is setup.
        const { queryByA11yLabel } = render(<Menu activeButton={'home'} onButtonClicked={jest.fn()} />);
        const homeButton = queryByA11yLabel('menu-homebutton');
        const graphsButton = queryByA11yLabel('menu-graphsbutton');
        const infoButton = queryByA11yLabel('menu-infobutton');
        const notificationsButton = queryByA11yLabel('menu-notificationsbutton');

        // Then the 4 buttons should be displayed.
        expect(homeButton).toEqual(expect.anything());
        expect(graphsButton).toEqual(expect.anything());
        expect(infoButton).toEqual(expect.anything());
        expect(notificationsButton).toEqual(expect.anything());
    });

    it('should only highlight one button at a time', async () => {
        // Given the menu is setup with home as the activeButton.
        const { queryByA11yLabel, update } = render(<Menu activeButton={'home'} onButtonClicked={jest.fn()} />);
        const homeButton: any = queryByA11yLabel('menu-homebutton');
        const graphsButton: any = queryByA11yLabel('menu-graphsbutton');
        const infoButton: any = queryByA11yLabel('menu-infobutton');
        const notificationsButton: any = queryByA11yLabel('menu-notificationsbutton');
        
        // Then the home button should be highlighted.
        expect(homeButton.props.active).toBeTruthy();

        // And the other button should not.
        expect(graphsButton.props.active).toBeFalsy();
        expect(infoButton.props.active).toBeFalsy();
        expect(notificationsButton.props.active).toBeFalsy();

        // Given the menu now has notifications as the activeButton.
        update(<Menu activeButton={'notifications'} onButtonClicked={jest.fn()} />);

        // Then the notifications button should be highlighted.
        expect(notificationsButton.props.active).toBeTruthy();

        // And the other button should not.
        expect(homeButton.props.active).toBeFalsy();
        expect(graphsButton.props.active).toBeFalsy();
        expect(infoButton.props.active).toBeFalsy();
    });

    describe('Home button', () => {

        it('should display Home button', async () => {
            // Given the menu is setup.
            const { queryByA11yLabel } = render(<Menu activeButton={'home'} onButtonClicked={jest.fn()} />);
            
            // Then home button should be displayed.
            const button = queryByA11yLabel('menu-homebutton');
            expect(button).toEqual(expect.anything());
        });

        it('should let the user click on Home button to go to Home section', async () => {
            // Given the menu is setup with the following goTo callback
            // function.
            const goTo = jest.fn();
            const { queryByA11yLabel } = render(<Menu activeButton={'home'} onButtonClicked={goTo} />);

            // When the user presses the home button.
            const button = queryByA11yLabel('menu-homebutton');
            fireEvent.press(button);
            
            // Then the callback function should be called with Home component
            // as its only attribute.
            expect(goTo).toHaveBeenCalledWith('home');
        });

        it('should highlight Home button when the user is in Home section', async () => {
            // Given the menu is with Home as the activeButton.
            const { queryByA11yLabel } = render(<Menu activeButton={'home'} onButtonClicked={jest.fn()} />);

            // Then the home button should be highlighted.
            const button: any = queryByA11yLabel('menu-homebutton');
            expect(button.props.active).toBeTruthy();
        });

    });

    describe('Graph button', () => {

        it('should display Graph button', async () => {
            // Given the menu is setup.
            const { queryByA11yLabel } = render(<Menu activeButton={'home'} onButtonClicked={jest.fn()} />);

            // Then graph button should be displayed.
            const button = queryByA11yLabel('menu-graphsbutton');
            expect(button).toEqual(expect.anything());
        });

        it('should disable Graph button', async () => {
            // Given the menu is setup.
            const { queryByA11yLabel } = render(<Menu activeButton={'home'} onButtonClicked={jest.fn()} />);

            // Then the Graph button should be disabled.
            const button: any = queryByA11yLabel('menu-graphsbutton');
            expect(button.props.disabled).toBeTruthy();
        });

    });

    describe('Info button', () => {

        it('should display Info button', async () => {
            // Given the menu is setup.
            const { queryByA11yLabel } = render(<Menu activeButton={'home'} onButtonClicked={jest.fn()} />);

            // Then info button should be displayed.
            const button = queryByA11yLabel('menu-infobutton');
            expect(button).toEqual(expect.anything());
        });

        it('should disable Info button', async () => {
            // Given the menu is setup.
            const { queryByA11yLabel } = render(<Menu activeButton={'home'} onButtonClicked={jest.fn()} />);

            // Then the Graph button should be disabled.
            const button: any = queryByA11yLabel('menu-infobutton');
            expect(button.props.disabled).toBeTruthy();
        });

    });

});
