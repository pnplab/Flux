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

import OnboardingSurveyTaskView from './OnboardingSurveyTaskView';

// Configure types.
type Props = {

};
type State = {

};

// Configure component logic.
export default class OnboardingSurveyTaskController extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {

        };
    }

    render() {
        return (
            <OnboardingSurveyTaskView
                onStartTaskClicked={this.props.onStartTaskClicked}
                onStepBypassed={this.props.onStepBypassed}
            />
        );
    }

}
