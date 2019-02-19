/*
 * @flow
 */

import type { State } from './types';

// Set the default state.
// @warning This is the default *synchronous* state. Asynchronous
//    initialization occurs at an higher abstraction level, through adapters.
const initialState: State = {
    route: undefined && '/graph/symptoms' && '/graph/symptoms/select' && '/survey',
    hasStudyBeenInitialized: undefined,
    isSurveyTaskAvailable: undefined,
    isRestingStateTaskAvailable: undefined,

    // Symptom Graph state namespace.
    symptomGraph: {
        filter: 'month',
        symptomIds: [
            // 'b30eeb7b-dd40-4723-b292-34c6a36f2996',
            // '8f7e9aff-544e-49b7-873f-b215e86d6dcc',
            // '192998de-5e58-47a8-8eb6-2f9f3b16f719'
        ],
        symptomRecords: {
            
        }
    },
};

export default initialState;
