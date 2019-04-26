/*
 * @flow
 */

import type { State, Action } from '../memory-db/types';
import type { Store, Dispatch } from 'redux';
import { YellowBox } from 'react-native';
import { OPENING_HOUR as surveyTaskOpeningHour, CLOSING_HOUR as surveyTaskClosingHour } from '../business-rules/SurveyTaskScheduleRules';
import { enableSurveyTask, disableSurveyTask, disableRestingStateTask, symptomGraph } from '../memory-db/actions';
import awareManager from '../native-db/AwareManager';
const { completeLoadSymptoms } = symptomGraph;

import realm from '../persistent-db';

// @warning This disable the following warning, but we don't have working
//     solution apart from reimplementing/fixing react-native timer natively
//     ourselves.
//
// Setting a timer for a long period of time, i.e. multiple minutes, is a
// performance and correctness issue on Android as it keeps the timer module
// awake, and timers can only be called when the app is in the foreground. See
// https://github.com/facebook/react-native/issues/12981 for more info.
YellowBox.ignoreWarnings([
    'Setting a timer'
]);

const enforceSurveyTaskSchedule = (store: Store<State, Action>) => {
    // Enable experiment
    _executeAtTimeOfDay(surveyTaskOpeningHour, 0, () => {
        store.dispatch(enableSurveyTask());

        // Disable resting state task once the next survey task has been enabled.
        // @todo Move out of Survey Task Adapter !
        store.dispatch(disableRestingStateTask());
    });

    // Disable experiment
    _executeAtTimeOfDay(surveyTaskClosingHour, 0, () => {
        store.dispatch(disableSurveyTask());
    });

    // @todo Kill experiment (if one is active)
    // @note We've disabled this as we can treat these data server-side.
    // 
    // _executeAtTimeOfDay(CLOSING_HOUR, 30, () => {
    //     if (getState().isSurveyOngoing) {
    //         // Trigger kill experiment dispatch if one is ongoing.
    //         dispatch({
    //             type: 'KILL_SURVEY'
    //         });
    //     }
    //     else {
    //         // Do nothing if no experiment is ongoing
    //         // ...
    //     }
    // });
};

export default enforceSurveyTaskSchedule;

// Sync app state to realm db on triggered action.
export const syncSurveyFormToRealmMiddleWare = (store: Store<State, Action>) => (next: Dispatch) => async (action: Action) => {
    // @warning async is not handled ! We do not know in our app state when the
    //     database has effectively recorded the value !
    switch (action.type) {
    case 'SUBMIT_SURVEY_TASK_FORM':
    {
        const { timestamp, payload } = action; // Prevent flow from crying (rightfully).

        // Push the survey form to local db.
        (async () => {
            try {
                // Open realm database.
                let db = await realm;

                // Write data.
                db.write(() => {
                    // (action: Action);

                    let surveyForm = db.create('SurveyForm', {
                        // openDate: ,
                        submissionDate: new Date(timestamp),
                        answers: []
                    });
                    for (let prop in payload) {
                        if (payload.hasOwnProperty(prop)) {
                            surveyForm.answers.push({
                                questionId: prop,
                                value: payload[prop]
                            });
                        }
                    }
                });
            }
            catch (e) {
                // Display the error on console.
                console.error(e);
            }
        })();

        // Push the survey form to aware.
        (async () => {
            try {
                // Push the survey form to aware!
                awareManager.addSurveyData(timestamp, payload);
            }
            catch (e) {
                // Display the error on console.
                console.error(e);
 
            }
        })();

        break;
    }

    case 'GRAPH.SYMPTOM.LOAD_SYMPTOMS':
        // Load symptoms based on symptomGraph.symptomIds.
        (async () => {
            try {
                // Open database.
                let db = await realm;

                // Retrieve symptom to load from store.
                let { filter, symptomIds } = store.getState().symptomGraph;
                
                const sinceDatetime = ((filter) => {
                    let d = new Date();

                    switch ( filter ) {
                    case 'year':
                        var pastYear = d.getFullYear() - 1;
                        d.setFullYear(pastYear);
                        break;
                    case 'month':
                        d.setDate(1);
                        d.setMonth(d.getMonth()-1);
                        break;
                    case 'week':
                        d = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7);
                        break;
                    default:
                        console.error('error!');
                    }

                    return d;
                })(filter);

                if (symptomIds.length > 0) {
                    // @note Hopefully realm will manage the cache well ?
                    //     Otherwise we'll have to add a prev/new comparison
                    //     layer + cache.

                    let filteredForms = db
                        .objects('SurveyForm')
                        .filtered('submissionDate > $0', sinceDatetime);

                    let result: {
                        [symptomId: string]: {
                            [formSubmissionTimestamp: string]: number
                        }
                    } = {};
                    
                    filteredForms
                        .forEach(form => {
                            let submissionTimestamp = form.submissionDate.getTime();

                            let answers = form.answers.filtered(symptomIds.map(v => `questionId == "${v}"`).join(' OR '));
                            
                            answers
                                .forEach(answer => {
                                    result[answer.questionId] = result[answer.questionId] || {};
                                    result[answer.questionId][submissionTimestamp] = answer.value;
                                });
                                
                        });

                    // Dispatch loaded symptoms.
                    store.dispatch(completeLoadSymptoms(result));
                }
            }
            catch(e) {
                // Display the error on console.
                console.error(e);
            }
        })();
        break;

    default:
        break;
    }

    return next(action);
};

const _executeAtTimeOfDay = (hour, minute, callback) => {
    // @todo close the timer once app closes?

    // Find out when to send the callback.
    let now = new Date();
    let millisLeft = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hour,
        minute,
        0,
        0
    ) - now;
    if (millisLeft < 0) {
        // We're past 9PM, set 9PM for tommorow
        millisLeft += 86400000;
    }

    // Trigger callback every days.
    setTimeout(() => {
        // Trigger callback.
        callback();

        // Trigger the function recursively once executed for the next day.
        _executeAtTimeOfDay(hour, minute, callback);
    }, millisLeft);
};
