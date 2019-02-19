/*
 * @flow
 */

export type Action =
    // @pre This action should only be called at launch time.
    | {| +type: 'INIT_STUDY_AS_NOT_INITIALIZED' |}
    // @pre This action should only be called at launch time.
    | {| +type: 'INIT_STUDY_AS_INITIALIZED' |}
    // @pre This action should only be called following an according user
    //     action. This separate action is used to be able to sync the value in
    //     the local db.
    | {| +type: 'INITIALIZE_STUDY' |}
    // Enable survey, triggered at a specific time of day.
    | {| +type: 'ENABLE_SURVEY_TASK' |}
    // Disable survey, triggered at a specific time of day.
    | {| +type: 'DISABLE_SURVEY_TASK' |}
    | {| +type: 'OPEN_SURVEY_TASK' |}
    // Start the survey.
    | {| +type: 'START_SURVEY_TASK' |}
    // Submit the survey.
    | {| +type: 'SUBMIT_SURVEY_TASK_FORM', +timestamp: number, +payload: {| [questionId: string]: number |} |}

    | {| +type: 'ENABLE_RESTING_STATE_TASK' |}
    | {| +type: 'DISABLE_RESTING_STATE_TASK' |}
    | {| +type: 'OPEN_RESTING_STATE_TASK' |}
    | {| +type: 'POSTPONE_RESTING_STATE_TASK' |}
    | {| +type: 'START_RESTING_STATE_TASK' |}
    | {| +type: 'SUBMIT_RESTING_STATE_TASK' |}
    | {| +type: 'OPEN_GRAPHS' |}
    | {| +type: 'GRAPH.SYMPTOM.TOGGLE_SYMPTOM', +symptomId: string |}
    | {| +type: 'GRAPH.SYMPTOM.LOAD_SYMPTOMS' |}
    | {| +type: 'GRAPH.SYMPTOM.COMPLETE_LOAD_SYMPTOMS', +records: $PropertyType<$PropertyType<State, 'symptomGraph'>, 'symptomRecords'> |}
    | {| +type: 'GRAPH.SYMPTOM.OPEN_GRAPH' |}

export type Route =
    | '/'
    | '/initial-setup'
    | '/survey'
    | '/resting-state'
    | '/resting-state/video'
    | '/graph' // @deprecated
    | '/graph/usage'
    | '/graph/symptoms/select'
    | '/graph/symptoms';

export type State = {|
    // The current route / location in the app.
    //
    // @note Set undefined when we do not know yet the current route. This
    //     happens for instance when we want to check first if the app has been
    //     initialized in order to redirect the user to the correct route at 
    //     app launch time.
    +route: ?Route,

    // Has the study already been authorized through a password & initialized ?
    // 
    // @note Set undefined when we do not know yet if the study has been set,
    //     as it has to be retrieved asynchronously. Otherwise, true or false.
    +hasStudyBeenInitialized: ?boolean,

    // The survey can only be filled at specific time, depending on the study.
    +isSurveyTaskAvailable: ?boolean,

    // The resting state task can only be done at specific time.
    +isRestingStateTaskAvailable: ?boolean,

    // Symptom Graph state namespace.
    +symptomGraph: {|
        +filter: 'year' | 'month' | 'week',
        +symptomIds: Array<string>,
        +symptomRecords: {
            [symptomId: string]: {
                [formSubmissionTimestamp: string]: number
            }
        },
    |}
|};

