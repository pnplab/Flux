/*
 * @flow
 *
 * @description
 * The study the user is currently participating to.
 */

export default {
    name: 'Study',
    properties: {
        hasStudyBeenInitialized: { type: 'bool', default: false },
    }
};

export function initStudySchema(realm) {
    realm.write(() => {
        const study = realm.create('Study', {
            hasStudyBeenInitialized: false,
        });
    });
};