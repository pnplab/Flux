/*
 * @flow
 *
 * @pre
 * This screen should only be shown if app has not been authorized yet !
 *
 * @description
 * Setup screen. User set a password that sets up & activates the study.
 */

import React, { PureComponent } from 'react';
import NetInfo from '@react-native-community/netinfo';
import CheckWifiView from './CheckWifiView';

// Configure types.
type Props = {
    +onStepFinished: () => void,
};
type State = {
    +status: 'undefined' | 'none' | 'wifi' | 'cellular' | 'error';
};

// Configure component logic.
export default class CheckWifiController extends PureComponent<Props, State> {

    constructor(props: Props) {
        super(props);

        this.state = {
            status: 'undefined'
        };
    }

    componentDidMount() {
        // Retrieve connection info + listen to changes.
        NetInfo
            .getConnectionInfo()
            .then(this._onConnectionChange);

        NetInfo.addEventListener('connectionChange', this._onConnectionChange);
    }

    componentWillUnmount() {
        // Unbind listeners.
        NetInfo.removeEventListener('connectionChange', this._onConnectionChange);
    }

    _onConnectionChange = connectionInfo => {
        switch(connectionInfo.type) {
        case 'none':
            this.setState({ status: 'none' });
            break;
        case 'wifi':
            this.setState({ status: 'wifi' });
            break;
        case 'cellular':
            this.setState({ status: 'cellular' });
            break;
        case 'unknown':
        default:
            this.setState({ status: 'error' });
            break;
        }
    }

    onSubmit = () => {
        this.props.onStepFinished();
    }

    render() {
        return (
            <CheckWifiView
                status={this.state.status}
                onSubmit={this.onSubmit}
            />
        );
    }

}
