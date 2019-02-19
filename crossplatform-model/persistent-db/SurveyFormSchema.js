/*
 * @flow
 */

import SurveyFormItemSchema from './SurveyFormItemSchema';

export default {
    name: 'SurveyForm',
    properties: {
        submissionDate: { type: 'date', indexed: true },
        answers: { type: 'list', objectType: 'SurveyFormItem' }
    }
};
