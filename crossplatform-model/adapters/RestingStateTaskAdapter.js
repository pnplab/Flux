/*
 * @flow
 */

import type { State, Action } from '../memory-db/types';
import type { Store, Dispatch } from 'redux';

// @note Redux' `is resting state task enabled` at init time is set through
//      StudySchemaAdapter loading function.

// Sync app state to realm db on triggered action.
export const syncRestingStateTaskBusinessRuleMiddleWare = (store: Store<State, Action>) => (next: Dispatch) => async (action: Action) => {
    
    switch (action.type) {
    default:
        break;
    }

    return next(action);
};

