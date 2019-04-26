/*
 * @flow
 */

import type { State, Action } from '../memory-db/types';
import type { Store, Dispatch } from 'redux';
import awareManager from '../native-db/AwareManager';

// @note Redux' `is resting state task enabled` at init time is set through
//      StudySchemaAdapter loading function.

// Sync app state to realm db on triggered action.
export const syncRestingStateTaskBusinessRuleMiddleWare = (store: Store<State, Action>) => (next: Dispatch) => async (action: Action) => {
    
    switch (action.type) {
    case 'SUBMIT_SURVEY_TASK_FORM':
        awareManager.addSurveyData(action.timestamp, action.payload);
        break;

    default:
        break;
    }

    return next(action);
};

