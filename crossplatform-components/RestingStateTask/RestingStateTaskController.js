/*
 * @flow
 */

import React, { PureComponent } from 'react';
import type { Event } from 'react';
import RestingStateTaskPreparationView from './RestingStateTaskPreparationView';
import RestingStateTaskVideoView from './RestingStateTaskVideoView';

import { NativeModules, DeviceEventEmitter } from 'react-native';

const RestingStateTaskNativeModule = NativeModules.RestingStateTask;
// When muse is not compatible, the java module is not injected.
const isMuseCompatible = typeof RestingStateTaskNativeModule !== 'undefined';

// Configure types.
type Props = {
    onTaskPostponed: () => void, // Props is optional, if not set, postpone button wont appear.
    onTaskFinished: (msTimestamp: number) => void
};
type State = {
    step: 'PREPARATION' | 'VIDEO',
    taskPreparationState: 'UNDEFINED' | 'BLUETOOTH_DISABLED' |
        'MUSE_DISCONNECTED' | 'MUSE_CONNECTING' | 'MUSE_CONNECTED'
};

// Configure component logic.
//
// This component relies on java for the controller part. The views are in
// javascript. The code below only act as a wrapper between the two. It's best
// for the controller to be in java as the logic is hardware driven (w/
// bluetooth and muse EEG). Creating a full wrapper of the used models instead
// (muse eeg) would have been overengineering, and creating a minimal wrapper
// would have bring additional complexity without the benefits of the
// flexibility brought by the way the wrapper could be use.
//
// This component handles a signle controller for two views. Indeed the logic
// is inherently stateful across those views since they both depends and handle
// the stateful muse bluetooth connection (among data acquisition as well).
export default class RestingStateTaskController extends PureComponent<Props, State> {

    constructor(props: Props) {
        super(props);

        this.state = {
            step: 'PREPARATION',
            taskPreparationState: 'UNDEFINED'
        };
    }

    // Sync js model state based on java state.
    _onTaskPreparationStateChanged = (evt: Event) => {
        let taskPreparationState = evt.state;
        this.setState({ taskPreparationState });
    }
    componentDidMount() {
        DeviceEventEmitter.addListener('TASK_PREPARATION_STATE_CHANGED', this._onTaskPreparationStateChanged);

        this.onPreparationViewOpened();
    }
    componentWillUnmount() {
        DeviceEventEmitter.removeListener('TASK_PREPARATION_STATE_CHANGED', this._onTaskPreparationStateChanged);
    }

    render() {
        switch (this.state.step) {
        case 'PREPARATION':
            return (
                <RestingStateTaskPreparationView
                    state={this.state.taskPreparationState}
                    onStartTaskButtonClicked={this.onStartTaskButtonClicked}
                    onPostponeTaskButtonClicked={this.onPostponeTaskButtonClicked}
                />
            );
        case 'VIDEO':
            return (
                <RestingStateTaskVideoView
                    onVideoStreamStarted={this.onVideoStreamStarted}
                    onVideoStreamFinished={this.onVideoStreamFinished}
                    onVideoLoadingError={this.onVideoLoadingError}
                />
            );
        default:
            throw new Error('Assertion: bad step state inside RestingStateTaskController');
        }
    }

    // Forward js view state to java.
    onPreparationViewOpened = () => {
        RestingStateTaskNativeModule.onPreparationViewOpened();
    }
    onStartTaskButtonClicked = () => {
        // Apply changes related to model.
        RestingStateTaskNativeModule.onStartTaskButtonClicked();

        // Change view state to video.
        this.setState({ step: 'VIDEO' });
    }
    onPostponeTaskButtonClicked = () => {
        // Apply changes related to model.
        // @todo change method name to onPostponeTaskButtonClicked in java
        RestingStateTaskNativeModule.onStartTaskButtonLongPush();

        // Bypass video.
        this.props.onTaskPostponed();
    }

    onVideoStreamStarted = () => {
        RestingStateTaskNativeModule.onVideoStreamStarted();
    }
    onVideoStreamFinished = () => {
        RestingStateTaskNativeModule.onVideoStreamFinished();

        // Get current timestamp to date the task end.
        const currentTimestamp = new Date().getTime();

        // Go to next step.
        this.props.onTaskFinished(currentTimestamp);
    }
    onVideoLoadingError = () => {
        RestingStateTaskNativeModule.onVideoLoadingError();
    }

}
