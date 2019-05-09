/*
 * @flow
 *
 * @pre
 * This screen should only be shown if app has not been authorized yet !
 *
 * @description
 * Setup screen. User set a password that sets up & activates the study.
 */

import type { State as AppState } from '../../crossplatform-model/memory-db/types';
import { onboarding } from '../../crossplatform-model/memory-db/actions'

import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import OnboardingRestingStateTaskView from './OnboardingRestingStateTaskView';
import { PrepareRestingStateController } from '../RestingStateTask/PrepareRestingStateController';
import { RestingStateController } from '../RestingStateTask/RestingStateController';

// Configure types.
type Props = {
    
};
type State = {
    +step: 'text' | 'prepare' | 'task'
};

// Configure component logic.
class OnboardingRestingStateTaskController extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            step: 'text'
        };
    }

    onStartTask = () => {
        this.setState({ step: 'prepare' });
    }

    // Called when long pressing start task button for 7s! Useful to bypass the
    // Muse resting state step for ci integration testing with aws device farm
    // as they dont have Muse.
    onBypassTask = () => {
        // @todo next go to step!
        this.props.bypassRestingState();
    }

    // postponeRestingStateTask = () => {
    //     // Step back to initial step.
    //     // @todo display error !
    //     this.setState({ step: 'text' });
    // }

    startRestingStateTask = () => {
        this.setState({ step: 'task' });
    }

    onVideoError = () => {
        // Step back to initial step.
        // @todo display error !
        this.setState({ step: 'text' });
    }

    submitRestingStateTask = () => {
        // Store in db!
        console.warn('@todo store in db!');

        // @todo store in db!
    }

    // Go to next step when the user pushes the submit button!
    // goToNextStep = () => {
    //     console.log('next!');
    // 

    render() {
        switch (this.state.step) {
        case 'text':
            return (
                <OnboardingRestingStateTaskView
                    onStartTask={this.onStartTask}
                    onBypassTask={this.onBypassTask}
                />
            );
        case 'prepare':
            return (
                <PrepareRestingStateController
                    postponeRestingStateTask={undefined}
                    startRestingStateTask={this.startRestingStateTask}
                />
            );
        case 'task':
            return (
                <RestingStateController
                    onVideoError={this.onVideoError}
                    submitRestingStateTask={this.submitRestingStateTask}
                />
            );
        }
    }

}

// Bind comoponent to redux.
const mapStateToProps = (state: AppState /*, ownProps*/) => ({

});

const mapDispatchToProps = {
    bypassRestingState: onboarding.bypassRestingState
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(OnboardingRestingStateTaskController);
