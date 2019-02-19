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

import { initializeStudy } from '../../crossplatform-model/memory-db/actions'
import InitialSetupView from './InitialSetupView';

const DEFAULT_ACTIVATION_PASSWORD = '4wc2uw';

// Configure types.
type Props = {
    +activationPassword?: string,
    +initializeStudy: (password: string) => Void
};
type State = {
    currentPassword?: string,
    error?: string
};

// Configure component logic.
class InitialSetupController extends PureComponent<Props, State> {

    static defaultProps = {
        activationPassword: DEFAULT_ACTIVATION_PASSWORD
    };

    constructor(props) {
        super(props);

        this.state = {
            currentPassword: '',
            error: undefined,
        };

        this.onPasswordChanged = this.onPasswordChanged.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    onPasswordChanged(password: string) {
        this.setState({ currentPassword: password });
    }
    
    onSubmit() {
        // Show error on failure.
        if (this.state.currentPassword !== this.props.activationPassword) {
            this.setState({ error: 'Mot de passe erroné.' });
        }
        // Trigger initialization on success.
        else {
            this.setState({ error: undefined });
            this.props.initializeStudy(this.state.currentPassword);
        }
    }

    render() {
        return (
            <InitialSetupView
                error={this.state.error}
                password={this.state.currentPassword}
                onPasswordChanged={this.onPasswordChanged}
                onSubmit={this.onSubmit}
            />
        );
    }

}

// Bind comoponent to redux.
const mapStateToProps = (state: AppState /*, ownProps*/) => ({

});

const mapDispatchToProps = {
    initializeStudy: initializeStudy
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(InitialSetupController);
