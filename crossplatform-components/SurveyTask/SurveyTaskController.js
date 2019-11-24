/*
 * @flow
 *
 * @description
 * Startup screen, showing the button to access the survey depending on the
 * time.
 */

import React, { PureComponent } from 'react';

import type { Question } from '../../crossplatform-model/immutable-db/QuestionType';
import Questions from '../../crossplatform-model/immutable-db/QuestionData';

import SurveyTaskView from './SurveyTaskLeanView';

// Configure types.
type Props = {
    +onSubmit: (msTimestamp: number, values: { [questionId: string]: number }) => void,
};
type State = {
    +missingQuestionIds: Array<string>
};

// Configure component logic.
// @note Export the raw controller on top of the connected component so it can
//     be used & customized in the onboarding process.
export default class SurveyTaskController extends PureComponent<Props, State> {

    questions: Array<Question>;
    values: { [questionId: string]: number };

    static defaultProps = {
        
    };

    constructor(props: Props) {
        super(props);
        
        this.state = {
            missingQuestionIds: []
        };

        this.questions = Questions.toJS();
        this.values = {};
    }

    onValue = (questionId: string, value: number) => {
        // Store question's value.
        this.values[questionId] = value;

        // Remove missing questions if not pristine.
        if (this.state.missingQuestionIds.length !== 0) {
            this.setState({
                missingQuestionIds: this.state.missingQuestionIds
                    .filter(id => id !== questionId)
            });
        }
    }

    listMissingQuestionIds = (): Array<string> => {
        const questionIds = this.questions.map(q => q.id);
        const filledQuestionIds = Object.keys(this.values);

        let missingQuestionIds = [];

        // List missing questions (questions that have not been answered by
        // the user).
        for (let i = 0; i < questionIds.length ; ++i) {
            let questionId = questionIds[i];

            // Add missing questions.
            if (!filledQuestionIds.includes(questionId)) {
                missingQuestionIds.push(questionId);
            }
        }

        return missingQuestionIds;
    }

    onSubmit = () => {
        // List missing questions.
        let missingQuestionIds = this.listMissingQuestionIds();

        // Ensure every values have been set.
        let hasError = missingQuestionIds.length !== 0;
        // Update displayed errors if any.
        if (hasError) {
            this.setState({
                missingQuestionIds
            });
        }
        // Submit form if no error.
        else {
            // Get current timestamp to date the form.
            const currentTimestamp = new Date().getTime();

            // Forward submission to components' user.
            this.props.onSubmit(currentTimestamp, this.values);
        }
    }

    render() {
        return (
            <SurveyTaskView
                data={this.questions}
                missingQuestionIds={this.state.missingQuestionIds}
                onValue={this.onValue}
                onSubmit={this.onSubmit}
            ></SurveyTaskView>
        );
    }
}
