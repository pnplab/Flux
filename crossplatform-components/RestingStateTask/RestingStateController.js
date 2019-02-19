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
import MuseManager, { MuseStatus } from '../../crossplatform-model/native-db/MuseManager';
import { postponeRestingStateTask, submitRestingStateTask } from '../../crossplatform-model/memory-db/actions.js'

import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import RestingStateView from './RestingStateView';

import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

// Configure types.
type Props = {

};
type State = {

};

// Configure component logic.
class RestingStateController extends PureComponent<Props, State> {

    static defaultProps = {

    };

    unsubscribe$ = new Subject();

    constructor(props) {
        super(props);

        this.state = {
            museStatus: MuseManager.getMuseStatus()
        };

        this.onVideoError = this.onVideoError.bind(this);
        this.onVideoEnd = this.onVideoEnd.bind(this);
    }


    componentDidMount() {
        if (MuseManager.getMuseStatus() !== MuseStatus.MUSE_CONNECTED) {
            console.error('Muse should already be connected once the video is ongoing! Connecting it back!');
            MuseManager.startListening();
        }
        
        MuseManager
            .onBluetoothEnabledStream
            .pipe(
                takeUntil(this.unsubscribe$),
            )
            .subscribe(v => this.setState({
                museStatus: MuseStatus.BLUETOOTH_ENABLED
            }));

        MuseManager
            .onBluetoothDisabledStream
            .pipe(
                takeUntil(this.unsubscribe$),
            )
            .subscribe(v => this.setState({
                museStatus: MuseStatus.BLUETOOTH_DISABLED
            }));

        MuseManager
            .onMuseConnectingStream
            .pipe(
                takeUntil(this.unsubscribe$),
            )
            .subscribe(v => this.setState({
                museStatus: MuseStatus.MUSE_CONNECTING
            }));

        MuseManager
            .onMuseDisconnectedStream
            .pipe(
                takeUntil(this.unsubscribe$),
            )
            .subscribe(v => this.setState({
                museStatus: MuseStatus.MUSE_DISCONNECTED
            }));

        MuseManager
            .onMuseConnectedStream
            .pipe(
                takeUntil(this.unsubscribe$),
            )
            .subscribe(v => this.setState({
                museStatus: MuseStatus.MUSE_CONNECTED
            }));
    }

    componentWillUnmount() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
        MuseManager.stopListening();
    }

    render() {
        return (
            <RestingStateView
                status={this.state.museStatus}
                onVideoError={this.onVideoError}
                onVideoEnd={this.onVideoEnd}
            />
        );
    }

    onVideoError(e) {
        MuseManager.disconnectMuse();
        console.error('Video Error while watching resting state\'s video. Postponing video!', e);
        this.props.postponeRestingStateTask();
    }
    
    onVideoEnd() {
        MuseManager.disconnectMuse();
        this.props.submitRestingStateTask();
    }

}

// Bind comoponent to redux.
const mapStateToProps = (state: AppState /*, ownProps*/) => ({

});

const mapDispatchToProps = {
    postponeRestingStateTask,
    submitRestingStateTask
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RestingStateController);
