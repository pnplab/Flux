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
            error?: number 
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
        // @warning @todo Make sure the automatic aware sync is off duroing the
        //          onboarding process as listened sync events could be 
        //          overriden by it!

        // Listen to sync events & update react state accordingly.
        this._unlistenSyncEvents = AwareManager.listenSyncEvents({
            onSyncStarted: this.onTableSyncStarted,
            onSyncBatchStarted: this.onTableSyncBatchStarted,
            onSyncFinished: this.onTableSyncFinished,
            onSyncFailed: this.onTableSyncFailed
        });
    }

    // List of table to sync, so we know when the upload as finished.
    // @warning This has to be kept in sync depending on the study!
    // @todo Retrieve this table dynamically from Aware!
    tableToSync = [
        'accelerometer',
        'applications',
        'battery',
        'communication',
        'calls',
        'messages',
        'gyroscope',
        'location_gps',
        'network_events',
        'network_traffic',
        'processor',
        'proximity',
        'screen',
        'telephony',
        'wifi',
    ];

    onTableSyncStarted = ({ table, rowCount }) => {
        // Update current table state.
        this.setState(s => ({
            ...s,
            syncStatus: {
                ...s.syncStatus,
                [table]: {
                    status: 'SYNC_ONGOING',
                    rowCount: rowCount,
                    lastRowUploaded: 0,
                    error: undefined
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
                    lastRowUploaded: lastRowUploaded,
                }
            }
        }));
    };
    onTableSyncFinished = ({ table }) => {
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
            let dataCheckup = AwareManager.getSyncDataCheckup();
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
