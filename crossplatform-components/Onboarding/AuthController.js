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

import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import { onboarding } from '../../crossplatform-model/memory-db/actions'
import AuthView from './AuthView';

const DEFAULT_ACTIVATION_PASSWORD = '4wc2uw';

// Configure types.
type Props = {
    +onStepFinished: (string, string) => void,
};
type State = {
    currentPassword?: string,
    currentDeviceId?: string,
    error?: string
};

// Configure component logic.
export default class AuthController extends PureComponent<Props, State> {

    static defaultProps = {
        activationPassword: DEFAULT_ACTIVATION_PASSWORD
    };

    constructor(props) {
        super(props);

        this.state = {
            currentPassword: '',
            currentDeviceId: '',
            error: undefined,
        };
    }

    onPasswordChanged = (password: string) => {
        this.setState({ currentPassword: password });
    }

    onDeviceIdChanged = (deviceId: string) => {
        this.setState({ currentDeviceId: deviceId });
    }
    
    onSubmit = () => {
        // Show error on failure.
        if (this.state.currentDeviceId === '') {
            this.setState({ error: 'numéro d\'identification non défini' });
            return;
        }

        // @todo
        // if (!/^$/.test(this.state.currentDeviceId)) {
        //     this.setState({ error: 'mauvais format de numéro d\'identification' });
        //     return;
        // }

        if (this.state.currentPassword !== this.props.activationPassword) {
            this.setState({ error: 'code d\'accès erroné' });
            return;
        }
        // Trigger initialization on success.
        this.setState({ error: undefined });
        this.props.onStepFinished(this.state.currentPassword, this.state.currentDeviceId);
    }

    render() {
        return (
            <AuthView
                error={this.state.error}
                
                password={this.state.currentPassword}
                onPasswordChanged={this.onPasswordChanged}
                
                deviceId={this.state.currentDeviceId}
                onDeviceIdChanged={this.onDeviceIdChanged}

                onSubmit={this.onSubmit}
            />
        );
    }

}

// // Bind comoponent to redux.
// const mapStateToProps = (state: AppState /*, ownProps*/) => ({

// });

// const mapDispatchToProps = {
//     auth: onboarding.auth
// };

// export default connect(
//   mapStateToProps,
//   mapDispatchToProps
// )(AuthController);
