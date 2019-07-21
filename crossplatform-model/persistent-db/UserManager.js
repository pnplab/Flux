/*
 * @flow
 */

import realm from '../persistent-db';

class UserManager {

    constructor() {

    }

    // Used to know if we need to display the onboarding (as the app/aware/...
    // have not yet been initialised) or not.
    async isUserAlreadySetup(): Promise<boolean> {
        // Open realm database.
        let db = await realm;

        // Check the user exists.
        let users = db.objects('User');
        let userCount = users.length;
        let doesUserExist = userCount === 0 ? false : true;

        // Return result accordingly.
        return doesUserExist;
    }

    async setupUser(studyModality: 'daily' | 'weekly', awareDeviceId: string, awareStudyUrl: string): Promise<void> {
        // Open realm database.
        let db = await realm;

        // Check the inputs are correct.
        if (studyModality !== 'weekly' && studyModality !== 'daily') {
            throw new Error('studyModality should either be weekly or daily. studyModality=' + studyModality);
        }
        if (typeof awareDeviceId === 'undefined') {
            throw new Error('awareDeviceId is undefined');
        }
        if (typeof awareStudyUrl === 'undefined') {
            throw new Error('awareStudyUrl is undefined');
        }

        // Check the user isn't currently setup.
        let users = db.objects('User');
        let userCount = users.length;
        if (userCount !== 0) {
            throw new Error('User already setup.');
        }
        
        // Create and fill the first and only User entry.
        // @note This code is synchronous!
        db.write(() => {
            db.create('User', {
                studyModality,
                awareDeviceId,
                awareStudyUrl,
                lastSubmittedSurveyTaskTimestamp: undefined,
                lastSubmittedRestingStateTaskTimestamp: undefined
            });
        });
    }
    
    // @warning Throws if user isn't set yet.
    async getUserSettings(): Promise<{|
        +studyModality: 'daily' | 'weekly',
        +awareDeviceId: string,
        +awareStudyUrl: string,
        +lastSubmittedSurveyTaskTimestamp: number,
        +lastSubmittedRestingStateTaskTimestamp: number
    |}> {
        // Open realm database.
        let db = await realm;

        // Check the user exists.
        let users = db.objects('User');
        let userCount = users.length;
        if (userCount === 0) {
            throw new Error('User doesn\'t exist yet.');
        }

        // Retrieve the user.
        let user = users[0];

        // Return the user.
        // @note Realm queried objects are readonly. No need to worry about
        // record immutability, we can provide the object as is! However, their
        // architecture is slow (especially when debugging) as it relies on RPC
        // with c++ native code to retrieve the data everytime we dereference
        // the object. Thus better to copy its content.
        return {
            ...user
        };
    }

    // Timestamp of the last done tasks used by HomeController to suggest
    // the appropriate task to do (eg. not propose a survey task if the
    // user has just done it 5 minutes ago).
    async setLastSubmittedSurveyTaskTimestamp(ms: number) {
        // Open realm database.
        let db = await realm;

        // Check the user exists.
        let users = db.objects('User');
        let userCount = users.length;
        if (userCount === 0) {
            throw new Error('User doesn\'t exist yet.');
        }

        // Retrieve the user.
        let user = users[0];

        // Update the user's timestamp.
        db.write(() => {
            user.lastSubmittedSurveyTaskTimestamp = ms;
        });
    }
    async getLastSubmittedSurveyTaskTimestamp() {
        // Open realm database.
        let db = await realm;

        // Check the user exists.
        let users = db.objects('User');
        let userCount = users.length;
        if (userCount === 0) {
            throw new Error('User doesn\'t exist yet.');
        }

        // Retrieve the user.
        let user = users[0];

        // Return the timestamp.
        return user.lastSubmittedSurveyTaskTimestamp;
    }
    async setLastSubmittedRestingStateTaskTimestamp(ms: number) {
        // Open realm database.
        let db = await realm;

        // Check the user exists.
        let users = db.objects('User');
        let userCount = users.length;
        if (userCount === 0) {
            throw new Error('User doesn\'t exist yet.');
        }

        // Retrieve the user.
        let user = users[0];

        // Update the user's timestamp.
        db.write(() => {
            user.lastSubmittedRestingStateTaskTimestamp = ms;
        });
    }
    async getLastSubmittedRestingStateTaskTimestamp() {
        // Open realm database.
        let db = await realm;

        // Check the user exists.
        let users = db.objects('User');
        let userCount = users.length;
        if (userCount === 0) {
            throw new Error('User doesn\'t exist yet.');
        }

        // Retrieve the user.
        let user = users[0];

        // Return the timestamp.
        return user.lastSubmittedRestingStateTaskTimestamp;
    }

}

const userManager = new UserManager();

export default userManager;
