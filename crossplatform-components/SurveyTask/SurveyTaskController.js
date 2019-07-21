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
    onSubmit: (msTimestamp: number, values: { [questionId: string]: number }) => void,
};
type State = {
    
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

        };

        this.questions = Questions.toJS();
        this.values = {};
    }

    onValue = (questionId: string, value: number) => {
        // Store question's value.
        this.values[questionId] = value;
    }

    onSubmit = () => {
        // Get current timestamp to date the form.
        const currentTimestamp = new Date().getTime();

        // Forward submission to components' user.
        this.props.onSubmit(currentTimestamp, this.values);
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
