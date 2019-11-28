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
import BugReporter from '../../crossplatform-model/native-db/BugReporter';

// Configure types.
type Props = {
    +children: ({ [key: string]: any }) => Component<{}, {}>,
    +index: ComponentType<{}>
};
type State = {
    activeComponentType: ComponentType<{}>,
    studyModality?: String,
    awareDeviceId?: String,
    awareStudyUrl?: String,
};

// Configure component logic.
export default class OnboardingController extends Component<Props, State> {

    // Set displayName for debug and bugreport navigation tracing.
    static displayName = 'Onboarding';

    constructor(props: Props) {
        super(props);

        this.state = {
            activeComponentType: this.props.index
        };
    }

    goToStep = (componentType: ComponentType<any>) => {
        // Retrieve current component name. We can't compare from ECMA import
        // or use `contructor.name` because of code minification process. Thus
        // we use displayName react property. It should be set for all
        // component!
        let componentName = componentType.displayName;

        // Trace component navigation for precise bug reporting.
        if (typeof componentName === 'undefined' || componentName === null) {
            console.warn('unknown component name for bug reporting on OnboardingController#goToStep');
            BugReporter.breadcrumb('onboarding/unknown', 'navigation');
        }
        else {
            BugReporter.breadcrumb('onboarding/'+componentName, 'navigation');
        }

        // Switch shown component.
        this.setState({ activeComponentType: componentType });
    }

    render() {
        // Retrieve returned components from render prop function.
        const childFunctionResult = this.props.children({
            goToStep: this.goToStep,

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
        const activeComponentType = this.state.activeComponentType;

        // Retrieve the component instance to display.
        const shownComponent = children.filter(child => child.type === activeComponentType)[0];

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
