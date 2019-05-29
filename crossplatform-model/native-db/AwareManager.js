/*
 * @flow
 */

import { Platform, NativeModules, PermissionsAndroid } from 'react-native';
import { DeviceEventEmitter } from 'react-native';

class AwareManager {

    _awareManager = NativeModules.AwareManager;

    // @note AwareManager is used from adapter (for now) @todo refactor
    
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

    startAware(deviceId: string, encryptionKey: string) {
        // @warning Permissions must be received first before calling !
        this._awareManager.startAware(deviceId, encryptionKey);
    }

    stopAware() {
        this._awareManager.stopAware();
    }

    async joinStudy(studyUrl: string) {
        await this._awareManager.joinStudy(studyUrl);
    }

    addSurveyData(timestamp: number, payload: {| [questionId: string]: number |}) {
        this._awareManager.addSurveyData(timestamp, payload);
    }

    syncData() {
        this._awareManager.syncData();
    }

    // @returns () => {}: unlistener.
    listenSyncEvents({ onSyncStarted, onSyncBatchStarted, onSyncFinished, onSyncFailed }) {
        //   * Aware.ACTION_AWARE_SYNC_DATA_STARTED
        //        `TABLE`: string
        //        `ROW_COUNT`: number
        //   * Aware.ACTION_AWARE_SYNC_DATA_BATCH_STARTED
        //        `TABLE`: string
        //        `ROW_COUNT`: number
        //        `LAST_ROW_UPLOADED`: number
        //   * Aware.ACTION_AWARE_SYNC_DATA_FINISHED
        //        `TABLE`: string
        //   * Aware.ACTION_AWARE_SYNC_DATA_FAILED
        //        `TABLE`: string
        //        `ERROR`: string
        //               | `NO_STUDY_SET`
        //               | `OUT_OF_MEMORY`
        //               | `TABLE_CREATION_FAILED`
        //               | `SERVER_UNREACHABLE`
        //               | `SERVER_CONNECTION_INTERRUPTED`
        //               | `UNHANDLED_EXCEPTION`

        let syncDataStartedSubscription = DeviceEventEmitter.addListener('Aware.ACTION_AWARE_SYNC_DATA_STARTED', (e: Event) => { 
            onSyncStarted({
                table: e.TABLE,
                rowCount: e.ROW_COUNT
            });
        });
        let syncDataBatchStartedSubscription = DeviceEventEmitter.addListener('Aware.ACTION_AWARE_SYNC_DATA_BATCH_STARTED', (e: Event) => { 
            onSyncBatchStarted({
                table: e.TABLE,
                rowCount: e.ROW_COUNT,
                lastRowUploaded: e.LAST_ROW_UPLOADED
            });
        });
        let syncDataFinishedSubscription = DeviceEventEmitter.addListener('Aware.ACTION_AWARE_SYNC_DATA_FINISHED', (e: Event) => { 
            onSyncFinished({
                table: e.TABLE,
            });
        });
        let syncDataFailedSubscription = DeviceEventEmitter.addListener('Aware.ACTION_AWARE_SYNC_DATA_FAILED', (e: Event) => { 
            onSyncFailed({
                table: e.TABLE,
                error: e.ERROR
            });
        });

        // Return unlisten function!
        return () => {
            syncDataStartedSubscription.remove();
            syncDataBatchStartedSubscription.remove();
            syncDataFinishedSubscription.remove();
            syncDataFailedSubscription.remove();
        };
    }

    async getDeviceId() {
        return this._awareManager.getDeviceId();
    }

    async getSyncedDataCheckupForTable(table: string, deviceId?: string) {
        // Set default deviceId to this device.
        if (typeof deviceId === 'undefined') {
            deviceId = await this.getDeviceId();
        }

        // Check deviceId & table types for potential security issue (has it
        // comes from a json response in CheckDataSyncController).
        if (!/^[a-zA-Z0-9_\-]{3,}$/.test(deviceId)) {
            throw new Error('Bad deviceId format!');
        }
        if (!/^[a-zA-Z0-9_\-]{3,}$/.test(table)) {
            throw new Error('Bad table name format!');
        }

        // Retrieve sync data checkup.
        let response = await fetch(`https://www.pnplab.ca/check-sync/android/${table}/${deviceId}`);
        let rowCountByTable = await response.json();

        // @note This return the number of row in the table for this deviceId (same response format as getSyncedDataCheckup).
        return rowCountByTable;
    }
    async getSyncedDataCheckup(deviceId?: string) {
        // Set default deviceId to this device.
        if (typeof deviceId === 'undefined') {
            deviceId = await this.getDeviceId();
        }

        // Check deviceId type for potential security issue (has it comes from
        // a json response in CheckDataSyncController).
        if (!/^[a-zA-Z0-9_\-]{3,}$/.test(deviceId)) {
            throw new Error('Bad deviceId format!');
        }

        // Retrieve sync data checkup.
        let response = await fetch(`https://www.pnplab.ca/check-sync/android/${deviceId}`);
        let rowCountByTable = await response.json();

        // @note This return the number of row for this deviceId by table.
        // @warning Unefficient server-side!
        return rowCountByTable;
    }


    // Enable/Disable automatic and/or mandatory wifi & battery for sync.
    // @note This can't easily be done inside the Aware.syncData() method
    //     as all these processes are completely decoupled & asynchrone,
    //     without any result feedback inside the default aware source
    //     code. We thus do it at the controller opening & closing.
    // @warning This is bad design as it overrides the settings set through
    //     the web UI, making these useless without warning the user!
    enableAutomaticSync() {
        this._awareManager.enableAutomaticSync();
    }
    disableAutomaticSync() {
        this._awareManager.disableAutomaticSync();
    }    
    enableMandatoryWifiForSync() {
        this._awareManager.enableMandatoryWifiForSync();
    }
    disableMandatoryWifiForSync() {
        this._awareManager.disableMandatoryWifiForSync();
    }
    enableMandatoryBatteryForSync() {
        this._awareManager.enableMandatoryBatteryForSync();
    }
    disableMandatoryBatteryForSync() {
        this._awareManager.disableMandatoryBatteryForSync();
    }
}

const awareManager = new AwareManager();

export default awareManager;
