/**
 * @flow
 *
 * Policy defining which task to suggest to the user depending on current time
 * and time of last task execution. This policy has been developed for studies
 * that ask the user to execute tasks once a week.
 */

import moment from 'moment';

// Policy's output type.
export type Task = 'NO_TASK'
    | 'SURVEY_TASK'
    | 'RESTING_STATE_TASK';

// Global policy constants used to define when a task can be done by the user.
export const MIN_HOUR = 18;
export const MAX_HOUR = 22;
export const WEEKDAY = 7; // Weekday, ISO format [1,7].

// Curried/simplified function with predefined arguments. As used by the
// HomeController.
export default function (
    hasAtLeastOneSurveyBeenSubmitted: boolean,
    lastSubmittedSurveyTimestamp: ?number,
    hasAtLeastOneRestingStateTaskBeenSubmitted: boolean,
    lastSubmittedRestingStateTaskTimestamp: ?number
): Task {
    let now = moment().valueOf();
    let minHour = MIN_HOUR;
    let maxHour = MAX_HOUR;
    let weekday = WEEKDAY;

    return WeeklyTasksPolicy(
        now,
        minHour,
        maxHour,
        weekday,
        hasAtLeastOneSurveyBeenSubmitted,
        lastSubmittedSurveyTimestamp,
        hasAtLeastOneRestingStateTaskBeenSubmitted,
        lastSubmittedRestingStateTaskTimestamp
    );
}

// More general, testable policy code.
export function WeeklyTasksPolicy(
    nowTimestamp: number, // in millisecond timestamp (`moment.valueOf()` or `new Date()` - NOT `moment.unix()` which is in second!)
    minHour: number, // in hour, inclusive.
    maxHour: number, // in hour, exclusive.
    weekday: number, // weekday in ISO format [1, 7] where 7 is sunday.
    hasAtLeastOneSurveyBeenSubmitted: boolean,
    lastSubmittedSurveyTimestamp: ?number,
    hasAtLeastOneRestingStateTaskBeenSubmitted: boolean,
    lastSubmittedRestingStateTaskTimestamp: ?number
): Task {
    let now = moment(nowTimestamp);

    // Get week's opening hour time.
    let openingHour = now.clone();
    openingHour.set({
        hour: minHour,
        minute: 0,
        second: 0,
        milliseconds: 0,
        isoWeekday: weekday
    });

    // Get week's closing hour time.
    let closingHour = now.clone();
    closingHour.set({
        hour: maxHour,
        minute: 0,
        second: 0,
        milliseconds: 0,
        isoWeekday: weekday
    });

    // First check if we're inside task opening schedule.
    let isCurrentTimeInsideTaskScheduleTime = now.isSameOrAfter(openingHour) && now.isBefore(closingHour);

    // If we're outside of allowed task schedule, display no task.
    if (!isCurrentTimeInsideTaskScheduleTime) {
        return 'NO_TASK';
    }
    // ...otherwise,
    // if no survey has been submitted yet, suggest one.
    else if (!hasAtLeastOneSurveyBeenSubmitted) {
        return 'SURVEY_TASK';
    }
    // if a survey has already been already submitted...
    else if (hasAtLeastOneSurveyBeenSubmitted) {
        // Check if that survey was submitted during current opening time.
        let lastSubmittedSurveyMoment = moment(lastSubmittedSurveyTimestamp);
        let isLastSubmittedSurveyInsideOpeningSchedule = lastSubmittedSurveyMoment.isSameOrAfter(openingHour) && lastSubmittedSurveyMoment.isBefore(closingHour);

        // No survey submitted today yet. Allow to run the task now.
        if (!isLastSubmittedSurveyInsideOpeningSchedule) {
            return 'SURVEY_TASK';
        }
        // A survey has already been submitted, let's check if the same holds
        // true for resting state task in the next method.
        else if (!hasAtLeastOneRestingStateTaskBeenSubmitted) {
            return 'RESTING_STATE_TASK';
        }
        else if (hasAtLeastOneRestingStateTaskBeenSubmitted) {
            // Check if that resting state task was done during current
            // opening time.
            let lastSubmittedRestingStateTaskMoment = moment(lastSubmittedRestingStateTaskTimestamp);
            let isLastSubmittedRestingStateTaskInsideOpeningSchedule = lastSubmittedRestingStateTaskMoment.isSameOrAfter(openingHour) && lastSubmittedRestingStateTaskMoment.isBefore(closingHour);

            // The resting state task has still not been done by user, so 
            // we propose it.
            if (!isLastSubmittedRestingStateTaskInsideOpeningSchedule) {
                return 'RESTING_STATE_TASK';
            }
            // While we're inside the task schedule time, both resting
            // state task and survey task have already been done. Thus, we
            // can just show no task available.
            else {
                return 'NO_TASK';
            }
        }
        else {
            // Unexpected code flow. Prevent FlowType from showing an error
            // because of undefined return.
            throw new Error('Unexpected behavior, policy should have returned something.');
        }
    }
    else {
        // Unexpected code flow. Prevent FlowType from showing an error
        // because of undefined return.
        throw new Error('Unexpected behavior, policy should have returned something.');
    }
}
