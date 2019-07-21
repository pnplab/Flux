/*
 * @flow
 *
 * @description
 * This table should only have one entry as the app is single user. It
 * contains configuration settings useful to define the behavior of the app
 * such as the modalities of the ongoing study (eg. either let the user do the 
 * study's tasks every day or only once a week, aso).
 */

export default {
    name: 'User',
    properties: {
        // Study modality. Used to define the behavior of the app (eg. whether
        // the user has to do either daily or weekly tasks). Value can either 
        // be 'daily' or 'weekly'.
        studyModality: { type: 'string' },
        awareDeviceId: { type: 'string' },
        awareStudyUrl: { type: 'string' },
        // Timestamp of the last done tasks used by HomeController to suggest
        // the appropriate task to do (eg. not propose a survey task if the
        // user has just done it 5 minutes ago).
        lastSubmittedSurveyTaskTimestamp: { type: 'int?' },
        lastSubmittedRestingStateTaskTimestamp: { type: 'int?' }
    }
};