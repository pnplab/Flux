/*
 * @flow
 */

// Share a realm singleton as we cant close (`realm#close`) and reopen the same
// schema, cf. `https://realm.io/docs/javascript/0.14.0/api/Realm.html#close`
// > Closes this Realm so it may be re-opened with a newer schema version. All
// > objects and collections from this Realm are no longer valid after calling 
// > this method.

const Realm = require('realm');

import UserSchema from './UserSchema';
import StudySchema from './StudySchema';
import SurveyFormItemSchema from './SurveyFormItemSchema';
import SurveyFormSchema from './SurveyFormSchema';
import { FLUX_ENCRYPTION_KEY as envEncryptionKey } from '../../config';
import TextEncoder from './TextEncoder.polyfill';

// Convert string key to uint 8bit array key
const encoder = new TextEncoder();
const uint8ArrayEncryptionKey = encoder.encode(envEncryptionKey); // <- UInt8Array

// Interpolate n-size 8bit array to REALM's 64-item 8bit array.
// source: http://hevi.info/do-it-yourself/interpolating-and-array-to-fit-another-size/
// @note no need to convert unsigned to signed as these array are not clamped.
const linearInterpolate = (before, after, atPoint) => {
    return before + (after - before) * atPoint;
};
const interpolateArray = (data, fitCount) => {
    var newData = new Array();
    var springFactor = new Number((data.length - 1) / (fitCount - 1));
    newData[0] = data[0]; // for new allocation
    for ( var i = 1; i < fitCount - 1; i++) {
        var tmp = i * springFactor;
        var before = new Number(Math.floor(tmp)).toFixed();
        var after = new Number(Math.ceil(tmp)).toFixed();
        var atPoint = tmp - before;
        newData[i] = linearInterpolate(data[before], data[after], atPoint);
    }
    newData[fitCount - 1] = data[data.length - 1]; // for new allocation
    return newData;
};
const REALM_ENCRYPTION_KEY = new Int8Array(interpolateArray(uint8ArrayEncryptionKey, 64));

// Open db.
let db;
try {
    db = Realm.open({ schema: [ UserSchema, StudySchema, SurveyFormItemSchema, SurveyFormSchema ], encryptionKey: REALM_ENCRYPTION_KEY });
}
catch (e) {
    console.error(e)
}

export default db;