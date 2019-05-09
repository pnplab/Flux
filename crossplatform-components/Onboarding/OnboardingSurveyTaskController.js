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

import OnboardingSurveyTaskView from './OnboardingSurveyTaskView';
import { SurveyTaskController } from '../SurveyTask/SurveyTaskController';


// Configure types.
type Props = {
    submitSurveyTaskForm: (number, { [questionId: string]: number }) => void
};
type State = {
    +step: 'text' | 'task'
};

// Configure component logic.
class OnboardingSurveyTaskController extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            step: 'text'
        };
    }

    onStartTask = () => {
        this.setState({ step: 'task' });
    }


    // do not already enable resting state task in the main app flow  as we're 
    // still on the onboarding process and do not want to interfere with the 
    // app behavior.
    noop = () => { }

    submitSurveyTaskForm = (timestamp, values) => {
        // Store in db!
        this.props.submitSurveyTaskForm(timestamp, values);
    }

    // Go to next step when the user pushes the submit button!
    goToNextStep = () => {
        this.props.goToNextStep();
    }

    render() {
        switch (this.state.step) {
        case 'text':
            return (
                <OnboardingSurveyTaskView
                    onStartTask={this.onStartTask}
                />
            );
        case 'task':
            return (
                <SurveyTaskController
                    submitSurveyTaskForm={this.submitSurveyTaskForm}
                    enableRestingStateTask={this.noop}
                    goToNextStep={this.goToNextStep}
                />
            );
        }
    }

}

// Bind comoponent to redux.
const mapStateToProps = (state: AppState /*, ownProps*/) => ({

});

const mapDispatchToProps = {
    submitSurveyTaskForm: onboarding.submitSurvey,
    goToNextStep: onboarding.confirmSurveyTask
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(OnboardingSurveyTaskController);
