/*
 * @flow
 */ 

import type { State, Action } from './types';

import initialState from './initial-state';

export default function reducer(state: State = initialState, action: Action): State {
    switch (action.type) {
        /* Initial Setup */
        case 'INIT_STUDY_AS_NOT_INITIALIZED':
            if (typeof state.hasStudyBeenInitialized !== 'undefined') {
                throw new Error('Study should only be set as unitialized at launch time !');
            }
            return {
                ...state,
                // Redirect the user to initial setup page if study has not
                // been initialized yet!
                // @note The route checkup is only done to allow developer to
                //     set another initial route in debug mode in order to 
                //     speed up development time.
                route: typeof state.route === 'undefined' ? '/initial-setup' : state.route,
                hasStudyBeenInitialized: false
            };

        case 'INIT_STUDY_AS_INITIALIZED':
            return {
                ...state,
                // Redirect the user to home page once study has been
                // initialized!
                // @note The route checkup is only done to allow developer to
                //     set another initial route in debug mode in order to 
                //     speed up development time.
                route: typeof state.route === 'undefined' ? '/' : state.route,
                // Set the study as initialized.
                hasStudyBeenInitialized: true
            };
        case 'INITIALIZE_STUDY':
            return {
                ...state,
                // Redirect the user to home page once study has been
                // initialized!
                route: '/',
                // Set the study as initialized.
                hasStudyBeenInitialized: true
            };

        /* Survey */
        case 'ENABLE_SURVEY_TASK':
            return {
                ...state,
                isSurveyTaskAvailable: true
            };
        case 'DISABLE_SURVEY_TASK':
            // @note Survey can be disabled while still being ongoing. In this
            //     case, nothing happens, and the user is able to finish the
            //     survey anytime.
            return {
                ...state,
                isSurveyTaskAvailable: false
            };
        case 'OPEN_SURVEY_TASK':
            return {
                ...state,
                route: '/'
            };
        case 'START_SURVEY_TASK':
            return {
                ...state,
                route: '/survey'
            };
        case 'SUBMIT_SURVEY_TASK_FORM':
            return {
                ...state,
                // Disable survey once it has been sent!
                isSurveyTaskAvailable: false,
                // @note Route will be changed to '/resting-state' in Resting State Task Business Rule Adapter.
                // route: '/resting-state'
            };

        /* Eeg */
        case 'ENABLE_RESTING_STATE_TASK':
            return {
                ...state,
                isRestingStateTaskAvailable: true
            };
        case 'DISABLE_RESTING_STATE_TASK':
            return {
                ...state,
                isRestingStateTaskAvailable: false
            };
        case 'OPEN_RESTING_STATE_TASK':
            return {
                ...state,
                route: '/resting-state'
            };

        case 'POSTPONE_RESTING_STATE_TASK':
            return {
                ...state,
                route: '/'
            };

        case 'START_RESTING_STATE_TASK':
            return {
                ...state,
                route: '/resting-state/video'
            };

        case 'SUBMIT_RESTING_STATE_TASK': 
            return {
                ...state,
                // Disable survey once it has been sent!
                isRestingStateTaskAvailable: false,
                route: '/'
            };

        case 'OPEN_GRAPHS':
            return {
                ...state,
                route: '/graph'
            };

        case 'GRAPH.SYMPTOM.TOGGLE_SYMPTOM':
            return {
                ...state,
                symptomGraph: {
                    ...state.symptomGraph,
                    symptomIds: _toggleValueInArray(state.symptomGraph.symptomIds, action.symptomId)
                }
            };
            
        case 'GRAPH.SYMPTOM.OPEN_GRAPH':
            return {
                ...state,
                route: '/graph/symptoms',
            };

        case 'GRAPH.SYMPTOM.LOAD_SYMPTOMS':
            // This loads state.symptomGraph.symptomIds in SurveyTaskAdapter.

            return {
                ...state
            };

        case 'GRAPH.SYMPTOM.COMPLETE_LOAD_SYMPTOMS':
            // @todo

            return {
                ...state,
                symptomGraph: {
                    ...state.symptomGraph,
                    symptomRecords: action.records
                }
            };

        /* ... */
        default:
            (action: empty);

            if (!action.type.startsWith('@@')) {
                console.error('Unhandled action', action);
            }
            
            return state;
    }
};

const _toggleValueInArray = (array, val) => 
    array.indexOf(val) === -1 ?
        [...array, val] :
        array.filter(val_ => val_ !== val);
