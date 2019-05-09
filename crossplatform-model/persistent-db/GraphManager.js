/*
 * @flow
 */

import realm from '../persistent-db';

class GraphManager {

    constructor() {

    }

    async storeSurvey(timestamp: number, values: {| [questionId: string]: number |}) {
        // Open realm database.
        let db = await realm;

        // Write data.
        db.write(() => {

            // Create new form entry.
            let surveyForm = db.create('SurveyForm', {
                // openDate: ,
                submissionDate: new Date(timestamp),
                answers: []
            });

            // Fill form entry with the questions' values.
            for (let prop in values) {
                if (values.hasOwnProperty(prop)) {
                    surveyForm.answers.push({
                        questionId: prop,
                        value: values[prop]
                    });
                }
            }
        });
    }

}

const graphManager = new GraphManager();

export default graphManager;
