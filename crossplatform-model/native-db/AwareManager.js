/*
 * @flow
 */

import { Platform, NativeModules, PermissionsAndroid } from 'react-native';

class AwareManager {

    _awareManager = NativeModules.AwareManager;

    constructor() {

    }

    async requestPermissions() {
        // We need to add runtime permission check for dangerous permissions
        // on android ^23.
        // @warning Permissions must be present in manifest file otherwise
        //    `NEVER_ASK_AGAIN` will be automatically returned!

        // Disable runtime permission check on IOS
        if (Platform.OS !== 'android') {
            return;
        }

        try {
            console.log('Available permissions', PermissionsAndroid.RESULTS, PermissionsAndroid.PERMISSIONS);
            
            let permissions = [
                // PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE, // @note probably optional due to WRITE_* perm below
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                PermissionsAndroid.PERMISSIONS.GET_ACCOUNTS,
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
                PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
                PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
                PermissionsAndroid.PERMISSIONS.READ_SMS,
                PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
            ];

            // Use default OS rationale instead of custom one.
            let rationale = undefined && {
                title: 'Permission ...',
                message:
                    'Veuillez activer la permission.',
                buttonPositive: 'OK',
                buttonNeutral: 'Ne plus me demander!',
                buttonNegative: 'Refuser'
            };

            // Request permissions synchronously.
            for (var i=0; i<permissions.length; ++i) {
                let perm = permissions[i];
                let granted = await PermissionsAndroid.request(perm, rationale);

                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    console.log(`${perm} permission ${granted === PermissionsAndroid.RESULTS.GRANTED ? 'granted': 'denied'}!`);
                }
                else {
                    console.error(`${perm} permission ${granted === PermissionsAndroid.RESULTS.GRANTED ? 'granted': 'denied'}!`);
                }
            }
        } catch (err) {
            console.warn('Permission issue: ', err);
        }
    }

    startAware(deviceId: string) {
        // @warning Permissions must be received first before calling !
        this._awareManager.startAware(deviceId);
    }

    stopAware() {
        this._awareManager.stopAware();
    }

    joinStudy(studyUrl: string) {
        this._awareManager.joinStudy(studyUrl);
    }

    syncData() {
        this._awareManager.syncData();
    }

    async getDeviceId() {
        return this._awareManager.getDeviceId();
    }

}

const awareManager = new AwareManager();

export default awareManager;
