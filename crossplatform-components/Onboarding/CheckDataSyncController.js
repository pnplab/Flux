/*
 * @flow
 *
 * @pre
 * This screen should only be shown if app has not been authorized yet !
 *
 * @description
 * Setup screen. User set a password that sets up & activates the study.
 */

import type { State as AppState } from '../../crossplatform-model/memory-db/types';
import AwareManager from '../../crossplatform-model/native-db/AwareManager';

import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import CheckDataSyncView from './CheckDataSyncView';

// Configure types.
type Props = {
};
type State = {
    +currentStep: 'TEXT' | 'SYNC_ONGOING' | 'SYNC_DONE' | 'SYNC_ERROR',
    +syncStatus: {
        [table]: {
            +status: 'SYNC_ONGOING' | 'SYNC_DONE' | 'SYNC_ERROR',
            rowCount?: number,
            lastRowUploaded?: number,
            error?: number,
            serverSideRowCount?: number | null // null in case of error sent during server-side retrieval process
        }
    },
};

// Configure component logic.
export default class CheckDataSyncController extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            currentStep: 'TEXT',
            syncStatus: {

            }
        };
    }

    async componentDidMount() {
        // // @debug 
        // if (typeof process.env.FLUX_ENCRYPTION_KEY === 'undefined') {
        //     throw new Error('process.env.FLUX_ENCRYPTION_KEY is undefined!');
        // }
        // let encryptionKey = process.env.FLUX_ENCRYPTION_KEY;
        // let participantId = 'yoh';
        
        // // let deviceId = DeviceInfo.getUniqueID();
        // // console.log('DEVICE_ID', deviceId);

        // await AwareManager.requestPermissions();
        // AwareManager.startAware(participantId, encryptionKey);
        // await AwareManager.joinStudy('https://www.pnplab.ca/index.php/webservice/index/2/UvxJCl3SC4J3'); // @todo change url based on study.
        // // /@debug

        

        // @todo Make sure the automatic aware sync is off during the
        //     onboarding process as listened sync events could be overriden by
        //     it!

        // Disable automatic mandatory wifi & battery for sync.
        // @note This can't easily be done inside the Aware.syncData() method
        //     as all these processes are completely decoupled & asynchrone,
        //     without any result feedback inside the default aware source
        //     code. We thus do it at the controller opening & closing.
        AwareManager.disableAutomaticSync();
        AwareManager.disableMandatoryWifiForSync();
        AwareManager.disableMandatoryBatteryForSync();

        // Listen to sync events & update react state accordingly.
        this._unlistenSyncEvents = AwareManager.listenSyncEvents({
            onSyncStarted: this.onTableSyncStarted,
            onSyncBatchStarted: this.onTableSyncBatchStarted,
            onSyncFinished: this.onTableSyncFinished,
            onSyncFailed: this.onTableSyncFailed
        });
    }

    componentWillUnmount() {
        // Enable back automatic mandatory wifi & battery for sync on controller exit.
        // @note This can't easily be done inside the Aware.syncData() method
        //     as all these processes are completely decoupled & asynchrone,
        //     without any result feedback inside the default aware source
        //     code. We thus do it at the controller opening & closing.
        // @warning This is bad design as it overrides the settings set through
        //     the web UI, making these useless without warning the user!
        // @warning @todo !!! This is problematic of the app crashes during the
        //     check data onboarding process as automatic sync will never be
        //     resumed !!! This is dirty-patched by launch-time method call in
        //     StudySchemaAdapter in the meanwhile.
        AwareManager.enableMandatoryBatteryForSync();
        AwareManager.enableMandatoryWifiForSync();
        AwareManager.enableAutomaticSync();
    }

    onTableSyncStarted = ({ table, rowCount }) => {
        console.debug('pnplab::CheckDataSyncController #onTableSyncStarted', table, rowCount);

        // Init current table state.
        this.setState(s => ({
            ...s,
            syncStatus: {
                ...s.syncStatus,
                [table]: {
                    status: 'SYNC_ONGOING',
                    rowCount: rowCount,
                    lastRowUploaded: 0,
                    error: undefined,
                    serverSideRowCount: undefined
                }
            }
        }));
    };
    onTableSyncBatchStarted = ({ table, rowCount, lastRowUploaded }) => {
        console.debug('pnplab::CheckDataSyncController #onTableSyncBatchStarted', table, rowCount, lastRowUploaded);

        // Update current table state.
        this.setState(s => ({
            ...s,
            syncStatus: {
                ...s.syncStatus,
                [table]: {
                    ...s.syncStatus[table],
                    status: 'SYNC_ONGOING',
                    rowCount: rowCount,
                    lastRowUploaded: lastRowUploaded
                }
            }
        }));
    };
    onTableSyncFinished = async ({ table }) => {
        console.debug('pnplab::CheckDataSyncController #onTableSyncFinished', table);

        // Update current table state.
        this.setState(s => ({
            ...s,
            syncStatus: {
                ...s.syncStatus,
                [table]: {
                    ...s.syncStatus[table],
                    status: 'SYNC_DONE',
                    // @note As lastRowUploaded is only sync in
                    //       onTableSyncBatchStarted, last one update is
                    //       missing so we update it manually!
                    lastRowUploaded: s.syncStatus[table].rowCount
                }
            }
        }));

        // Check table status server-side !
        try {
            const serverSideTableRowCount = await AwareManager.getSyncedDataCheckupForTable(table);
            console.debug('pnplab::CheckDataSyncController #serverSideTableRowCount', serverSideTableRowCount);

            // Update current table state.
            this.setState(s => ({
                ...s,
                syncStatus: {
                    ...s.syncStatus,
                    [table]: {
                        ...s.syncStatus[table],
                        serverSideRowCount: serverSideTableRowCount
                    }
                }
            }), () => {
                // Trigger onFullSyncFinished once all the tables have either been
                // synced or have thrown an error
                if (this.isFullSyncFinished()) {
                    this.onFullSyncFinished();
                }
            });
        }
        // Error while counting synced data server-side!
        catch (e) {
            console.error('Error while counting synced data server-side!', table, e);
            console.debug('pnplab::CheckDataSyncController #error', table, e);

            this.setState(s => ({
                ...s,
                syncStatus: {
                    ...s.syncStatus,
                    [table]: {
                        ...s.syncStatus[table],
                        serverSideRowCount: null,
                    }
                }
            }), () => {
                // Trigger onFullSyncFinished once all the tables have either been
                // synced or have thrown an error
                if (this.isFullSyncFinished()) {
                    this.onFullSyncFinished();
                }
            });
        }
    };
    onTableSyncFailed = ({ table, error }) => {  
        console.debug('pnplab::CheckDataSyncController #onTableSyncFailed', table, error);

        // Update current table state.
        this.setState(s => ({
            ...s,
            syncStatus: {
                ...s.syncStatus,
                [table]: {
                    ...s.syncStatus[table],
                    status: 'SYNC_ERROR',
                    error: error
                }
            }
        }), () => {
            // Trigger onFullSyncFinished once all the tables have either been
            // synced or have thrown an error
            if (this.isFullSyncFinished()) {
                this.onFullSyncFinished();
            }
        });
    };

    isFullSyncFinished = () => {
        // @todo compare this to full table list.

        let studySensors = AwareManager.getStudySensorList();

        // Check if all sensors have already received an event from aware and 
        // thus are in the state.
        let observedSensors = Object.keys(this.state.syncStatus);

        // Return false if there is not enough sensor having received an event yet.
        if (observedSensors.length < studySensors.length) {
            return false;
        }

        // Sort them so we can compare item per item.
        studySensors = studySensors.sort();
        observedSensors = observedSensors.sort();

        // Make sure the study & observed sensors are the same (optional but
        // extra precautionous).
        let haveAllSensorsReceivedAnEvent = studySensors.every((v, i) => v === observedSensors[i]);

        // Return false otherwise.
        if (!haveAllSensorsReceivedAnEvent) {
            return false;
        }

        // Return true if all of them have either finished syncing or received
        // an error in the meanwhile.
        let haveAllSensorsFinished = observedSensors
            .map(table =>
                this.state.syncStatus[table].status === 'SYNC_DONE' ||
                this.state.syncStatus[table].status === 'SYNC_ERROR'
            )
            .reduce((a,b) => a && b, true);

        return haveAllSensorsFinished;
    };

    onFullSyncFinished = async () => {
        console.debug('pnplab::CheckDataSyncController #onFullSyncFinished');

        // Log all data so they can be retrieved in integration tests.
        console.info('######## FLUX INTEGRATION TEST DATA ########');
        for (let table in this.state.syncStatus) {
            let { status, lastRowUploaded, rowCount, serverSideRowCount, error } = this.state.syncStatus[table];
            if (serverSideRowCount === null) serverSideRowCount = 'null';
            if (error === undefined) error = 'undefined';

            console.info(`~test ${table}: ${status} ${lastRowUploaded}/${rowCount} ${serverSideRowCount} ${error}`)            
        }
        console.info('#############################################');

        // Check synced data server-side!
        try {
            // @todo verify no client sync error first.
            // let dataCheckup = await AwareManager.getSyncedDataCheckup();
            // console.log('dataCheckup', dataCheckup);
        }
        catch (e) {
            console.error('dataCheckup failure', e);
        }

        // @todo verify server sync is succesful first.
        this.setState({ currentStep: 'SYNC_DONE' })
    };

    componentWillUnmount() {
        // Unlisten to sync events.
        this._unlistenSyncEvents();
    }

    // Sync data to the server
    onSyncData = async () => {
        this.setState({ currentStep: 'SYNC_ONGOING' });
        AwareManager.syncData();
    }

    // Go to next step when the user pushes the submit button!
    goToNextStep = () => {
        this.props.onStepFinished();
    }

    render() {
        return (
            <CheckDataSyncView
                currentStep={this.state.currentStep}
                syncStatus={this.state.syncStatus}
                onSyncData={this.onSyncData}
                onNextClicked={this.goToNextStep}
            />
        );
    }

}
