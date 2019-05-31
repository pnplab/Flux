/*
 * @flow
 *
 * @note This contains app initializer !
 * @todo move them out into App.js
 */

import type { Action } from '../memory-db/types';
import type { Store, Dispatch } from 'redux';

import { aware } from '../memory-db/actions';
const [ listenDataSync, unlistenDataSync, requestAllPermissions, start, joinStudy, joinStudySucceeded ] = aware;

import AwareManager from '../native-db/AwareManager';

// Redux side effects related to Aware (native-db).
export const awareMiddleWare = (store: Store) => (next: Dispatch) => async (action: Action) => {
    switch (action.type) {
    case 'AWARE.LISTEN_DATA_SYNC':
        AwareManager.listenDataSync();
        break;

    case 'AWARE.UNLISTEN_DATA_SYNC':
        AwareManager.unlistenDataSync();
        break;

    case 'AWARE.REQUEST_ALL_PERMISSIONS':
        throw new Error('not implemented');

        await AwareManager.requestPermissions();

        // @todo trigger REQUEST_ALL_PERMISSIONS_SUCCEEDED
        
        break;

    case 'AWARE.START':
        // @warning Permissions must be received first before calling !

        throw new Error('not implemented');
        const deviceId, encryptionKey; // @todo

        AwareManager.startAware(deviceId, encryptionKey);
        
        break;

    case 'AWARE.JOIN_STUDY':
        const studyUrl = action.studyUrl;

        try {
            // Join study.
            await AwareManager.joinStudy(studyUrl);
            // Dispatch success once done.
            store.dispatch(joinStudySucceeded());
        }
        catch (e) {
            // @todo dispatch failure!
        }

        break;

    case 'AWARE.JOIN_STUDY_SUCCEEDED':
        // Nothing to do... Store's state has been modified in reducer!
        break;

    default:
        break;
    }

    return next(action);
};
