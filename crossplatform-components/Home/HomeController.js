/*
 * @flow
 *
 * @description
 * Startup screen, showing the button to access the survey depending on the
 * time.
 */

import React, { PureComponent } from 'react';
import type { Element } from 'react';
import { View } from 'react-native';

import DailyTasksPolicy from './DailyTasksPolicy';
import WeeklyTasksPolicy from './WeeklyTasksPolicy';

import Layout from '../Layout';
import HomeNoTaskView from './HomeNoTaskView';
import HomeSurveyTaskView from './HomeSurveyTaskView';
import HomeRestingStateTaskView from './HomeRestingStateTaskView';

// Configure types.
type Props = {
    +studyModality: 'daily' | 'weekly',
    +lastSubmittedSurveyTimestamp: ?number,
    +lastSubmittedRestingStateTaskTimestamp: ?number,
    +onStartSurveyTask: () => void,
    +onStartRestingStateTask: () => void,
    +menuComponent: Element<any>
};
type State = {
    // Undefined means the controller has not loaded yet the informations
    // required to do the processing.
    +suggestedTask: Task
};
export type Task = 'NO_TASK'
    | 'SURVEY_TASK'
    | 'RESTING_STATE_TASK';

// Configure component logic.
export default class HomeController extends PureComponent<Props, State> {

    // Set displayName for debug and bugreport navigation tracing.
    static displayName = 'Home';

    constructor(props: Props) {
        super(props);

        // Check studyModality is set correctly.
        if (!['daily', 'weekly'].includes(this.props.studyModality)) {
            throw new Error('studyModality should be defined as daily or weekly in <Home>');
        }

        this.state = {
            suggestedTask: this.getSuggestedTask()
        };
    }

    _intervalId = null;

    componentDidMount() {
        // Refresh the screen every second (only on change) in case the current
        // time changes thus making the underlying policy output change (ie.
        // the home screen no longer suggest a survey task because the user is
        // no longer inside the allowed schedule to participate to the task).
        // @note Would be probably more optimal to use a setTimeout and only
        //     refresh when needed but the optimization seems unnecessary as
        //     this is only a foreground operation.
        this._intervalId = setInterval(() => {
            let suggestedTask = this.getSuggestedTask();
            this.setState({ suggestedTask });
        }, 1000);
    }

    componentWillUnmount() {
        // Clear interval.
        clearInterval(this._intervalId);
    }

    render() {
        let innerView;

        switch(this.state.suggestedTask) {
        case 'NO_TASK':
            innerView = <HomeNoTaskView />;
            break;
        case 'SURVEY_TASK':
            innerView = <HomeSurveyTaskView onStartTaskClicked={this.props.onStartSurveyTask} />;
            break;
        case 'RESTING_STATE_TASK':
            innerView = <HomeRestingStateTaskView onStartTaskClicked={this.props.onStartRestingStateTask} />;
            break;
        default:
            throw new Error('Unexpected suggested task for home controller');
        }

        return (
            <View accessibilityLabel="home">
                <Layout menuComponent={this.props.menuComponent}>
                    {innerView}
                </Layout>
            </View>
        );
    }

    getSuggestedTask = (): Task => {
        // Pick the right policy based on component's attributes.
        let policy = undefined;
        switch (this.props.studyModality) {
        case 'daily':
            policy = DailyTasksPolicy;
            break;
        case 'weekly':
            policy = WeeklyTasksPolicy;
            break;
        default:
            throw new Error('Unexpected policy set from user\'s study modality');
        }

        // Retrieve policy arguments from component's attributes.
        // @note we could retrieve them from db here or from model instead of
        //     passing them down, thus improving separation of concerns,
        //     but that would cause a flicker at component loading thus
        //     making the app less responsive. Also, passing attributes
        //     through props make the component more testable.
        let lastSubmittedSurveyTimestamp = this.props.lastSubmittedSurveyTimestamp;
        let hasAtLeastOneSurveyBeenSubmitted = typeof lastSubmittedSurveyTimestamp === 'undefined' ? false : true;
        let lastSubmittedRestingStateTaskTimestamp = this.props.lastSubmittedRestingStateTaskTimestamp;
        let hasAtLeastOneRestingStateTaskBeenSubmitted = typeof lastSubmittedRestingStateTaskTimestamp === 'undefined' ? false : true;

        // Apply policy to retrieve what to display on home screen (ie. a
        // survey task, a resting state task or simply nothing).
        let suggestedTask = policy(
            hasAtLeastOneSurveyBeenSubmitted,
            lastSubmittedSurveyTimestamp,
            hasAtLeastOneRestingStateTaskBeenSubmitted,
            lastSubmittedRestingStateTaskTimestamp
        );

        // Return result.
        return suggestedTask;
    }

}