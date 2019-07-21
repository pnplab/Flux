/*
 * @flow
 */

import { createStore, applyMiddleware, compose } from 'redux';

import type { Action } from './types';
import reducer from './reducer'
import initialState from './initial-state';

// @todo move out of store.js, to an higher abstraction layer
import { loadStudySchema, syncStudyToRealmMiddleWare } from '../adapters/StudySchemaAdapter';
import enforceSurveyTaskSchedule, { syncSurveyFormToRealmMiddleWare } from '../adapters/SurveyTaskAdapter';
import { syncRestingStateTaskBusinessRuleMiddleWare } from '../adapters/RestingStateTaskAdapter'

// Enable redux dev tools if available.
const composeEnhancers = typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

// Decorate redux actions with timestamps.
const timestampDecorator = store => next => (action: Action) => {
    let date = new Date(); 
    let timestamp = date.getTime();
    if (typeof action.timestamp !== 'undefined') {
        console.warn('Action already has timestamp set before redux\' timestampDecorator middleware is applied!', action.type);
    }
    action.timestamp = timestamp;
    let result = next(action);
    return result;
};

const store = createStore(
    // Set up the reducer.
    reducer,
    // Apply initial synchronous schema loading.
    initialState,
    // Enable redux dev tools if available & apply other middlewares.
    composeEnhancers(
        // Apply sync to db middlewares
        applyMiddleware(
            timestampDecorator,
            syncStudyToRealmMiddleWare,
            syncSurveyFormToRealmMiddleWare,
            syncRestingStateTaskBusinessRuleMiddleWare,
        )
    )
);

// Apply initial asynchronous schema loadings into redux.
loadStudySchema(store);

// Update time-dependant states, such as enabling/disabling survey based on
// time of day.
enforceSurveyTaskSchedule(store);

// Export store.
export default store;
