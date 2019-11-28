/*
 * @flow
 *
 * @pre
 * This screen should only be shown if app has not been authorized yet !
 *
 * @description
 * Setup screen. User set a password that sets up & activates the study.
 */

import React, { PureComponent } from 'react';

import OnboardingRestingStateTaskView from './OnboardingRestingStateTaskView';
// import { PrepareRestingStateController } from '../RestingStateTask/PrepareRestingStateController';
// import { RestingStateController } from '../RestingStateTask/RestingStateController';

// Configure types.
type Props = {
    +onStartTask: () => void,
    +onBypasTask: () => void,
};
type State = {

};

// Configure component logic.
export default class OnboardingRestingStateTaskController extends PureComponent<Props, State> {

    // Set displayName for debug and bugreport navigation tracing.
    static displayName = 'OnboardingRestingStateTask';

    constructor(props: Props) {
        super(props);

        this.state = {
            
        };
    }

    render() {
        return (
            <OnboardingRestingStateTaskView
                onStartTask={this.props.onStartTask}
                onBypassTask={this.props.onBypassTask}
            />
        );
    }

}
