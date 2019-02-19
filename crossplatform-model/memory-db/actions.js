/*
 * @flow
 */

import type { State, Action } from './types';

export const initStudyAsNotInitialized: () => Action = () => ({
    type: 'INIT_STUDY_AS_NOT_INITIALIZED'
});

export const initStudyAsInitialized: () => Action = () => ({
    type: 'INIT_STUDY_AS_INITIALIZED'
});

export const initializeStudy: () => Action = () => ({
    type: 'INITIALIZE_STUDY'
});

export const enableSurveyTask: () => Action = () => ({
    type: 'ENABLE_SURVEY_TASK'
});

export const disableSurveyTask: () => Action = () => ({
    type: 'DISABLE_SURVEY_TASK'
});

export const openSurveyTask: () => Action = () => ({
    type: 'OPEN_SURVEY_TASK'
});

export const startSurveyTask: () => Action = () => ({
    type: 'START_SURVEY_TASK'
});

export const submitSurveyTaskForm: (timestamp: number, values: {| [questionId: string]: number |}) => Action = (timestamp, values) => ({
        type: 'SUBMIT_SURVEY_TASK_FORM',
        timestamp: timestamp,
        payload: values
    });

export const enableRestingStateTask: () => Action = () => ({
    type: 'ENABLE_RESTING_STATE_TASK'
});

export const disableRestingStateTask: () => Action = () => ({
    type: 'DISABLE_RESTING_STATE_TASK'
});

export const openRestingStateTask: () => Action = () => ({
    type: 'OPEN_RESTING_STATE_TASK'
});

export const postponeRestingStateTask: () => Action = () => ({
    type: 'POSTPONE_RESTING_STATE_TASK'
});

export const startRestingStateTask: () => Action = () => ({
    type: 'START_RESTING_STATE_TASK'
});

export const submitRestingStateTask: () => Action = () => ({
    type: 'SUBMIT_RESTING_STATE_TASK'
});

export const openGraphs: () => Action = () => ({
    type: 'OPEN_GRAPHS'
});

export const symptomGraph: {
    toggleSymptom: (string) => Action,
    loadSymptoms: () => Action,
    completeLoadSymptoms: ($PropertyType<$PropertyType<State, 'symptomGraph'>, 'symptomRecords'>) => Action,
    openGraph: () => Action
} = {
    toggleSymptom: (symptomId: string) => ({
        type: 'GRAPH.SYMPTOM.TOGGLE_SYMPTOM',
        symptomId: symptomId
    }),
    loadSymptoms: () => ({
        type: 'GRAPH.SYMPTOM.LOAD_SYMPTOMS'
    }),
    completeLoadSymptoms: (records: $PropertyType<$PropertyType<State, 'symptomGraph'>, 'symptomRecords'>) => ({
        type: 'GRAPH.SYMPTOM.COMPLETE_LOAD_SYMPTOMS',
        records: records
    }),
    openGraph: () => ({
        type: 'GRAPH.SYMPTOM.OPEN_GRAPH',
    })
};