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
import { postponeRestingStateTask, startRestingStateTask } from '../../crossplatform-model/memory-db/actions.js'

import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import PrepareRestingStateView from './PrepareRestingStateView';

import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

// Configure types.
type Props = {

};
type State = {

};

// Configure component logic.
class PrepareRestingStateController extends PureComponent<Props, State> {

    static defaultProps = {

    };

    unsubscribe$ = new Subject();

    constructor(props) {
        super(props);

        this.state = {
            museStatus: MuseManager.getMuseStatus()
        };

        this.onStartTaskPushed = this.onStartTaskPushed.bind(this);
        this.onPostponeTaskPushed = this.onPostponeTaskPushed.bind(this);
    }


    componentDidMount() {
        if (MuseManager.getMuseStatus() !== MuseStatus.MUSE_CONNECTED) {
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
            <PrepareRestingStateView
                status={this.state.museStatus}
                onStartTaskPushed={this.onStartTaskPushed}
                onPostponeTaskPushed={this.onPostponeTaskPushed}
            />
        );
    }

    onStartTaskPushed() {
        this.props.startRestingStateTask();
    }
    
    onPostponeTaskPushed() {
        MuseManager.disconnectMuse();
        this.props.postponeRestingStateTask();
    }

}

// Bind comoponent to redux.
const mapStateToProps = (state: AppState /*, ownProps*/) => ({

});

const mapDispatchToProps = {
    postponeRestingStateTask,
    startRestingStateTask
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PrepareRestingStateController);
