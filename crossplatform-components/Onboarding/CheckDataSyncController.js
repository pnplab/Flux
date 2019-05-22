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
class CheckDataSyncController extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            currentStep: 'TEXT',
            syncStatus: {

            }
        };
    }

    componentDidMount() {
        // @todo Make sure the automatic aware sync is off duroing the
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

    // List of table to sync, so we know when the upload as finished.
    // @warning This has to be kept in sync depending on the study!
    // @todo Retrieve this table dynamically from Aware!
    tableToSync = [
        'accelerometer',
        'aware_device',
        'aware_log',
        'aware_studies',
        'battery',
        'battery_charges',
        'battery_discharges',
        'calls',
        'cdma',
        'gsm',
        'gsm_neighbor',
        'gyroscope',
        'light',
        'locations',
        'messages',
        'network',
        'network_traffic',
        'processor',
        'proximity',
        'rotation',
        'screen',
        'sensor_accelerometer',
        'sensor_gyroscope',
        'sensor_light',
        'sensor_proximity',
        'sensor_rotation',
        'sensor_wifi',
        'telephony',
        'touch',
        'wifi',
    ];

    onTableSyncStarted = ({ table, rowCount }) => {
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
        }), () => {
            // Trigger onFullSyncFinished once all the tables have either been
            // synced or have thrown an error
            if (this.isFullSyncFinished()) {
                this.onFullSyncFinished();
            }
        });

        // Check table status server-side !
        try {
            const serverSideTableRowCount = await AwareManager.getSyncedDataCheckupForTable(table);

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
                        lastRowUploaded: s.syncStatus[table].rowCount,
                        serverSideRowCount: serverSideTableRowCount
                    }
                }
            }));
        }
        // Error while counting synced data server-side!
        catch (e) {
            console.error('Error while counting synced data server-side!', table, e);

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
                        lastRowUploaded: s.syncStatus[table].rowCount,
                        serverSideRowCount: null,
                    }
                }
            }));
        }
    };
    onTableSyncFailed = ({ table, error }) => {
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
        return Object
            .keys(this.state.syncStatus)
            .map(table =>
                this.state.syncStatus[table].status === 'SYNC_DONE' ||
                this.state.syncStatus[table].status === 'SYNC_ERROR'
            )
            .reduce((a,b) => a && b, true);
    };
    onFullSyncFinished = () => {
        // Check synced data server-side!
        try {
            let dataCheckup = AwareManager.getSyncedDataCheckup();
            console.log('dataCheckup', dataCheckup);
        }
        catch (e) {
            console.error('dataCheckup failure', e);
        }
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

    }

    render() {
        return (
            <CheckDataSyncView
                currentStep={this.state.currentStep}
                syncStatus={this.state.syncStatus}
                onSyncData={this.onSyncData}
                onSubmit={this.goToNextStep}
            />
        );
    }

}

// Bind comoponent to redux.
const mapStateToProps = (state: AppState /*, ownProps*/) => ({

});

const mapDispatchToProps = {

};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CheckDataSyncController);
