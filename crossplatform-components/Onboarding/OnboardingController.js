/*
 * @flow
 *
 * @pre
 * This screen should only be shown if app has not been authorized yet !
 */

import type { State as AppState } from '../../crossplatform-model/memory-db/types';

import React, { Component } from 'react';
import { isFragment } from 'react-is';
import AwareManager from '../../crossplatform-model/native-db/AwareManager';

// Configure types.
type Props = {
    +children: () => Array<React.Component>,
    +index: React.ComponentType
};
type State = {
};

// Configure component logic.
export default class OnboardingController extends Component<Props, State> {

    constructor(props) {
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
            setDeviceId: (deviceId) => this.setState({ deviceId }),
            setStudyId: (studyId) => this.setState({ studyId }),
            deviceId: this.state.deviceId,
            studyId: this.state.studyId,
        });

        // Retrieve returned fragment's children as an array
        const fragmentChild = React.Children.only(childFunctionResult);
        const children = isFragment(fragmentChild) ? React.Children.toArray(fragmentChild.props.children) : [ fragmentChild ];
        
        // Pick up the current component type to display in the onboarding.
        const shownComponentType = this.state.shownComponentType;

        // Rertieve the component instance to display.
        const shownComponent = children.filter(child => child.type === shownComponentType)[0];

        // Display component.
        return shownComponent;
    }

}

// // Bind comoponent to redux.
// const mapStateToProps = (state: AppState /*, ownProps*/) => ({

// });

// const mapDispatchToProps = {
// };

// export default connect(
//   mapStateToProps,
//   mapDispatchToProps
// )(OnboardingController);
