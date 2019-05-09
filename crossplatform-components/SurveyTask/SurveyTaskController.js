/*
 * @flow
 *
 * @description
 * Startup screen, showing the button to access the survey depending on the
 * time.
 */

import type { State as AppState } from '../../crossplatform-model/memory-db/types';

import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import type { Question } from '../../crossplatform-model/immutable-db/QuestionType';
import Questions from '../../crossplatform-model/immutable-db/QuestionData';
import { submitSurveyTaskForm, enableRestingStateTask, openRestingStateTask } from '../../crossplatform-model/memory-db/actions'

import SurveyTaskView from './SurveyTaskLeanView';

// Configure types.
type Props = {
    submitSurveyTaskForm: (number, { [questionId: string]: number }) => void,
    enableRestingStateTask: () => void,
    goToNextStep: () => void,
};
type State = {
    
};

// Configure component logic.
// @note Export the raw controller on top of the connected component so it can
//     be used & customized in the onboarding process.
export class SurveyTaskController extends PureComponent<Props, State> {

    questions: Array<Question>;
    values: { [questionId: string]: number };

    static defaultProps = {
        
    };

    constructor(props) {
        super(props);
        
        this.state = {

        };

        this.questions = Questions.toJS();
        this.values = {};
    }

    onValue = (questionId, value) => {
        // Store question's value.
        this.values[questionId] = value;
    }

    onSubmit = () => {
        // Store in realm + Change route through redux' action.
        let currentTimestamp = new Date().getTime();
        this.props.submitSurveyTaskForm(currentTimestamp, this.values);

        // Enable & open resting state task!
        this.props.enableRestingStateTask();
        this.props.goToNextStep();
    }

    render() {
        return (
            <SurveyTaskView
                data={this.questions}
                onValue={this.onValue}
                onSubmit={this.onSubmit}
            ></SurveyTaskView>
        );
    }
}

// Bind comoponent to redux.
const mapStateToProps = (state: AppState /*, ownProps*/) => ({
    
});

const mapDispatchToProps = {
    submitSurveyTaskForm,
    enableRestingStateTask,
    goToNextStep: openRestingStateTask,
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SurveyTaskController);
