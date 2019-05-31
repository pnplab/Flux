/*
 * @flow
 *
 * @note This contains app initializer !
 * @todo move them out into App.js
 */

import type { Action } from '../memory-db/types';
import type { Store, Dispatch } from 'redux';

import { initStudyAsInitialized, initStudyAsNotInitialized, enableSurveyTask, disableSurveyTask, enableRestingStateTask, disableRestingStateTask, onboarding } from '../memory-db/actions';

import realm, { initStudySchema } from '../persistent-db';
import AwareManager from '../native-db/AwareManager';
import FirebaseManager from '../native-db/FirebaseManager';
import { getLastSurveyOpeningTime, shouldSurveyTaskBeEnabled } from '../business-rules/SurveyTaskScheduleRules';
import DeviceInfo from 'react-native-device-info';

// Dispatch first study's state & is resting state task enabled to redux.
export const loadStudySchema: (store: Store) => Promise<void> = async (store: Store) => {
    try {
        // Open database.
        let db = await realm;

        // Retrieve all the studies.
        let studies = db.objects('Study');

        // Init study's data if the study data has not yet been stored.
        if (studies.length === 0) {
            initStudySchema(db);
        }

        // Dispatch first study's state to redux.
        // @todo adapt for multiple study
        let hasStudyBeenInitialized = studies[0].hasStudyBeenInitialized;
        if (!hasStudyBeenInitialized) {
            store.dispatch(initStudyAsNotInitialized());
        }
        else {
            store.dispatch(initStudyAsInitialized(studies[0].participantId));
        }

        let surveyForms = db.objects('SurveyForm');
        let count = surveyForms.length;
        if (count === 0) {
            // Enable/disable survey task based on current hour as it's never 
            // been done before.
            if (shouldSurveyTaskBeEnabled()) {
                store.dispatch(enableSurveyTask());
            }
            else {
                store.dispatch(disableSurveyTask());
            }

            // Disable resting state survey task as survey task never has been 
            // done before.
            store.dispatch(disableRestingStateTask());
        }
        else {
            let lastSurveyForm = surveyForms.sorted('submissionDate', true)[0]; // desc order
            let lastSurveySubmissionDate = lastSurveyForm.submissionDate.getTime();
            let lastSurveyOpeningTime = getLastSurveyOpeningTime();

            // Enable/disable survey task based on last submission & current
            // hours.
            let isSurveyTaskAvailable = shouldSurveyTaskBeEnabled(lastSurveySubmissionDate);
            if (!isSurveyTaskAvailable) {
                store.dispatch(disableSurveyTask());
            }
            else {
                store.dispatch(enableSurveyTask());
            }

            // Enable/disable resting state task based on last survey tassk
            // submission (enable resting state taske only if last opened
            // survey has been submitted).
            let isRestingStateTaskAvailable = lastSurveySubmissionDate > lastSurveyOpeningTime;
            if (!isRestingStateTaskAvailable) {
                store.dispatch(disableRestingStateTask());
            }
            else {
                store.dispatch(enableRestingStateTask());
            }
        }
    }
    catch(e) {
        // Display the error on console.
        console.error(e);

        // @warning @todo Handle error case (unlikely to happen, perhaps on
        //     corrupted db for instance).

        // @warning @todo Log this error server side as this can be critical on
        //     user experience!
    }
};

// Sync app state to db db on triggered action.
export const syncStudyToRealmMiddleWare = (store: Store) => (next: Dispatch) => async (action: Action) => {
    // @warning async is not handled ! We do not know in our app state when the
    //     database has effectively recorded the value !

    const initStudy = (async (participantId: string) => {
        try {
            // Open database.
            let db = await realm;

            // Retrieve all the studies.
            let studies = db.objects('Study');

            // Update the study as initialized.
            // @todo adapt for multiple study.
            db.write(() => {
                studies[0].hasStudyBeenInitialized = true;
                studies[0].participantId = participantId;
            });
        }
        catch(e) {
            // Display the error on console.
            console.error(e);
        }
    });

    const initModel = (async (participantId: string) => {
        try {
            // @warning @todo use better identification method.
            // 
            // iOS: This is IDFV so it will change if all apps from the current
            // apps vendor have been previously uninstalled. android: Prior to
            // Oreo, this id (ANDROID_ID) will always be the same once you set
            // up your phone.

            if (typeof process.env.FLUX_ENCRYPTION_KEY === 'undefined') {
                throw new Error('process.env.FLUX_ENCRYPTION_KEY is undefined!');
            }
            let encryptionKey = process.env.FLUX_ENCRYPTION_KEY;
            
            // let deviceId = DeviceInfo.getUniqueID();
            // console.log('DEVICE_ID', deviceId);

            await AwareManager.requestPermissions();
            AwareManager.startAware(participantId, encryptionKey);

            //                !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            // @warning @todo !!! Will make the app stuck if study fails !!!
            //                !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            await AwareManager.joinStudy('https://www.pnplab.ca/index.php/webservice/index/2/UvxJCl3SC4J3'); // @todo change url based on study.

            // Disable automatic mandatory wifi & battery for sync.
            // @note This can't easily be done inside the Aware.syncData() method
            //     as all these processes are completely decoupled & asynchrone,
            //     without any result feedback inside the default aware source
            //     code. We thus do it at the controller opening & closing.
            AwareManager.disableAutomaticSync();
            AwareManager.disableMandatoryWifiForSync();
            AwareManager.disableMandatoryBatteryForSync();

            // Change aware study state once done!
            store.dispatch(onboarding.setAwareStudyState(true));

            // await FirebaseManager.signIn();
            await FirebaseManager.requestPermissions();
            await FirebaseManager.startMessagingService();
        }
        catch(e) {
            // Display the error on console.
            console.error(e);
        }
    });

    switch (action.type) {
    case 'ONBOARDING.INITIALIZE_STUDY':
        initStudy(action.participantId);
        await initModel(action.participantId);
        
        break;

    case 'INIT_STUDY_AS_INITIALIZED':
        await initModel(action.participantId);

        // Force data sync settings at launch time.
        // @warning !!! This is a dirty-fix in case of crash during the
        //          Onboarding/CheckDataSyncController.js. See related
        //          source code for more info !!!
        AwareManager.enableMandatoryBatteryForSync();
        AwareManager.enableMandatoryWifiForSync();
        AwareManager.enableAutomaticSync();

        break;

    default:
        break;
    }

    return next(action);
};
