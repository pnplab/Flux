/**
 * @flow
 * @format
 */

import { View } from 'react-native';
import React from 'react';
import Layout from '../crossplatform-components/Layout';

// @note test renderer must be required after react-native.
import { render } from 'react-native-testing-library';

describe('Layout', () => {

    it('should not throw given correct attributes', async () => {
        // Render the Menu component.
        render(<Layout menuComponent={<View />}></Layout>);

        // If no error has been thrown yet, we're on the right track :-)
        expect(true);
    });

    it('should throw given incorrect attributes', async () => {
        // Hide react-native's console.error warning about uncaught thrown
        // exceptions.
        jest.spyOn(console, 'error');
        global.console.error.mockImplementation(() => {});

        // Render the Layout component without the menuComponent attribute.
        expect(() => {
            render(<Layout></Layout>);
        }).toThrow();

        // Render the Layout component with incorrect menuComponent attribute.
        expect(() => {
            render(<Layout menuComponent={'stringInsteadOfComponent'}></Layout>);
        }).toThrow();

        // Restore console.error function.
        global.console.error.mockRestore();
    });

    it('should display a single child', () => {
        // Given the layout is setup with a single child view.
        const { queryByA11yLabel } = render(
            <Layout menuComponent={<View />}>
                <View accessibilityLabel="singleChild" />
            </Layout>
        );

        // Then the single child view should be displayed.
        const singleChildView = queryByA11yLabel('singleChild');
        expect(singleChildView).toEqual(expect.anything());
    });

    it('should display multiple children', () => {
        // Given the layout is setup with a single child view.
        const { queryByA11yLabel } = render(
            <Layout menuComponent={<View />}>
                <View accessibilityLabel="childOne" />
                <View accessibilityLabel="childTwo" />
            </Layout>
        );

        // Then all the children view should be displayed.
        const childOneView = queryByA11yLabel('childOne');
        expect(childOneView).toEqual(expect.anything());
        const childTwoView = queryByA11yLabel('childTwo');
        expect(childTwoView).toEqual(expect.anything());
    });

    it('should display the given menu', async () => {
        // Given the layout is setup with a single child view.
        const menuComponent = <View accessibilityLabel="myMenu" />;
        const { queryByA11yLabel } = render(<Layout menuComponent={menuComponent}></Layout>);

        // Then the menu view should be displayed.
        const menuComponentView = queryByA11yLabel('myMenu');
        expect(menuComponentView).toEqual(expect.anything());
    });

});
