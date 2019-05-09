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
import { onboarding } from '../../crossplatform-model/memory-db/actions';

import React, { PureComponent } from 'react';
import { NetInfo } from 'react-native';
import { connect } from 'react-redux';

import CheckWifiView from './CheckWifiView';

// Configure types.
type Props = {
    +confirmNetwork: () => void,
};
type State = {
    +status: 'undefined' | 'none' | 'wifi' | 'cellular' | 'error';
};

// Configure component logic.
class CheckWifiController extends PureComponent<Props, State> {

    constructor(props) {
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
        this.props.confirmNetwork();
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

// Bind comoponent to redux.
const mapStateToProps = (state: AppState /*, ownProps*/) => ({

});

const mapDispatchToProps = {
    confirmNetwork: onboarding.confirmNetwork
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CheckWifiController);
