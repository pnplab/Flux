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
    +dataSyncEvents: any
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
            currentStep: 'TEXT'
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

    // Sync data to the server
    onSyncData = async () => {
        this.setState({ currentStep: 'SYNC_ONGOING' });
        AwareManager.syncData();
    }

    // Go to next step when the user pushes the submit button!
    goToNextStep = () => {
        this.props.onStepFinished();
    }

    processDataSyncEvents = () => {
        const dataSyncEvents = this.props.dataSyncEvents;

        let eventsByTable = {};

        for (let i=0; i<dataSyncEvents.length; ++i) {
            const evt = dataSyncEvents[i];

            // Initialise table name.
            eventsByTable[evt.table] = eventsByTable[evt.table] || [];

            // Add current evt to the table event list.
            eventsByTable[evt.table].push(evt);
        }

        const tableInfo = Object
            .keys(eventsByTable)
            .map(table => 
                ({
                    startedCount: eventsByTable[table]
                        .filter(evt => evt.type === 'SyncStarted')
                        .length > 0,
                    issueCount: eventsByTable[table]
                        .filter(evt => evt.type === 'SyncFailed')
                        .length,
                    succeededCount: eventsByTable[table]
                        .filter(evt => evt.type === 'SyncFinished')
                        .length
                })
            );

        const startedTables = Object
            .keys(eventsByTable)
            .filter(table => 
                eventsByTable[table]
                    .filter(evts => evts.type === 'SyncStarted')
                    .length > 0
            );


        const failedTables = Object
            .keys(eventsByTable)
            .filter(table => 
                eventsByTable[table]
                    .filter(evts => evts.type === 'SyncFailed')
                    .length > 0
            );

        const succeedTables = Object
            .keys(eventsByTable)
            .filter(table => 
                eventsByTable[table]
                    .filter(evts => evts.type === 'SyncFinished')
                    .length > 0
            );

        eventsByTable.filter
    }

    render() {
        return (
            <CheckDataSyncView
                currentStep={this.state.currentStep}
                syncStatus={this.processDataSyncEvents()}
                onSyncData={this.onSyncData}
                onSubmit={this.goToNextStep}
            />
        );
    }

}

// // Bind comoponent to redux.
// const mapStateToProps = (state: AppState /*, ownProps*/) => ({

// });

// const mapDispatchToProps = {

// };

// export default connect(
//   mapStateToProps,
//   mapDispatchToProps
// )(CheckDataSyncController);
