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
import { CheckDataSync } from './index';

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
            shownComponentType: this.props.index,
            awareDataSyncEvents: []
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        // If a state update is triggered even though the selected component is the same.
        if (this.props.children === nextProps.children &&
            this.props.index === nextProps.index &&
            this.state.shownComponentType === nextState.shownComponentType)
        {
            // The update is *only* due to a change in awareDataSyncEvents.
            // Thus, we'll not dispatch the rerendering unless we're inside CheckDataSync component.
            return nextState.shownComponentType === CheckDataSync ? true : false;
        }

        // Always rerender otherwise.
        return true;
    }

    componentWillUnmount() {
        // Unlisten aware data sync. Probably useless since the method is
        // already called manually before component unmount.
        if (this._unlistenAwareDataSync) {
            this._unlistenAwareDataSync();
        }
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

            // Listen aware data sync from aware start to data sync step as
            // there is no way to either prevent inital aware data sync when
            // the study is joined or force instant synchronous sync without
            // modifying aware core.
            listenAwareDataSync: () => this.listenAwareDataSync,
            unlistenAwareDataSync: () => this.unlistenAwareDataSync,
            awareDataSyncEvents: this.state.awareDataSyncEvents
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

    listenAwareDataSync = () => {
        // Listen to aware data sync events & adds updates to sourced events array accordingly.
        this._unlistenAwareDataSync = listenSyncEvents({
            onSyncStarted: (evt) => 
                this.setState(prevState => ({
                    awareDataSyncEvents: prevState.awareDataSyncEvents.concat([{
                        type: 'SyncStarted',
                        ...evt
                    }])
                })),
            onSyncBatchStarted: (evt) => 
                this.setState(prevState => ({
                    awareDataSyncEvents: prevState.awareDataSyncEvents.concat([{
                        type: 'SyncBatchStarted',
                        ...evt
                    }])
                })),
            onSyncFinished: (evt) => 
                this.setState(prevState => ({
                    awareDataSyncEvents: prevState.awareDataSyncEvents.concat([{
                        type: 'SyncFinished',
                        ...evt
                    }])
                })),
            onSyncFailed: (evt) => 
                this.setState(prevState => ({
                    awareDataSyncEvents: prevState.awareDataSyncEvents.concat([{
                        type: 'SyncFailed',
                        ...evt
                    }])
                })),
        });
    }
    unlistenAwareDataSync = () => {
        // Stop listening to aware data sync events.
        if (this._unlistenAwareDataSync) {
            this._unlistenAwareDataSync();
        }
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
