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
    status: 'TEXT' | 'SYNC_ONGOING' | 'SYNC_DONE' | 'SYNC_ERROR'
};

// Configure component logic.
class CheckDataSyncController extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            status: 'TEXT'
        };
    }

    componentDidMount() {
        
    }

    // Sync data to the server
    onSyncData = async () => {
        // Set 
        this.setState({ status: 'SYNC_ONGOING' });
        try {
            await AwareManager.syncData();
        }
        catch (e) {
            this.setState({ status: 'SYNC_ERROR' });
        }

        this.setState({ status: 'TEXT' });
    }

    // Go to next step when the user pushes the submit button!
    goToNextStep = () => {

    }

    render() {
        return (
            <CheckDataSyncView
                status={this.state.status}
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
