/*
 * @flow
 *
 * @pre
 * This screen should only be shown if app has not been authorized yet !
 */

import type { ComponentType } from 'react';
import React, { Component } from 'react';
import { View } from 'react-native';
import { isFragment } from 'react-is';

// Configure types.
type Props = {
    +children: ({ [key: string]: any }) => Component<{}, {}>,
    +index: ComponentType<{}>
};
type State = {
    shownComponentType: ComponentType<{}>,
    studyModality?: String,
    awareDeviceId?: String,
    awareStudyUrl?: String,
};

// Configure component logic.
export default class OnboardingController extends Component<Props, State> {

    constructor(props: Props) {
        super(props);

        this.state = {
            shownComponentType: this.props.index
        };
    }

    render() {
        // Retrieve returned components from render prop function.
        const childFunctionResult = this.props.children({
            goToStep: (componentType) => this.setState({ shownComponentType: componentType }),

            // Store aware info data from auth step until aware start step.
            setAwareDeviceId: (awareDeviceId) => this.setState({ awareDeviceId }),
            awareDeviceId: this.state.awareDeviceId,
            setAwareStudyUrl: (awareStudyUrl) => this.setState({ awareStudyUrl }),
            awareStudyUrl: this.state.awareStudyUrl,

            // Store study modality from auth step until onboarding end step
            // (where study modality and other details will be registered so
            // the user gets the app in the correct state (eg. without
            // onboarding step) next time he starts it).
            setStudyModality: (studyModality) => this.setState({ studyModality }),
            studyModality: this.state.studyModality,
        });

        // Retrieve returned fragment's children as an array
        const fragmentChild = React.Children.only(childFunctionResult);
        const children = isFragment(fragmentChild) ? React.Children.toArray(fragmentChild.props.children) : [ fragmentChild ];
        
        // Pick up the current component type to display in the onboarding.
        const shownComponentType = this.state.shownComponentType;

        // Rertieve the component instance to display.
        const shownComponent = children.filter(child => child.type === shownComponentType)[0];

        // Wrap shown component inside `onboarding` accessibilityLabel just for
        // the sake of being able to test onboarding presence.
        const wrappedShownComponent =
            <View accessibilityLabel="onboarding">
                {shownComponent}
            </View>;

        // Display component.
        return wrappedShownComponent;
    }

}
