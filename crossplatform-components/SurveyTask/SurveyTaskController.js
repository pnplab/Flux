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
    openRestingStateTask: () => void,
};
type State = {
    
};

// Configure component logic.
class SurveyTaskController extends PureComponent<Props, State> {

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
        this.props.openRestingStateTask();
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
    openRestingStateTask,
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SurveyTaskController);
