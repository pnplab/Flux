/*
 * @flow
 */

// Share a realm singleton as we cant close (`realm#close`) and reopen the same
// schema, cf. `https://realm.io/docs/javascript/0.14.0/api/Realm.html#close`
// > Closes this Realm so it may be re-opened with a newer schema version. All
// > objects and collections from this Realm are no longer valid after calling 
// > this method.

const Realm = require('realm');

import StudySchema from './StudySchema';
import SurveyFormItemSchema from './SurveyFormItemSchema';
import SurveyFormSchema from './SurveyFormSchema';

// @todo @warning Set the encryption key !!
let REALM_ENCRYPTION_KEY = new Int8Array(64);

// const db = Realm.open({ schema: [ StudySchema, SurveyFormItemSchema, SurveyFormSchema ], /* encryptionKey: REALM_ENCRYPTION_KEY */ });

try {
    var db = Realm.open({ schema: [ StudySchema, SurveyFormItemSchema, SurveyFormSchema ], /* encryptionKey: REALM_ENCRYPTION_KEY */ });
}
catch (e) {
    console.error(e)
}

export default db;