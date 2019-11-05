/*
 * @flow
 *
 * @pre
 * This screen should only be shown if app has not been authorized yet !
 *
 * @description
 * Setup screen. User set a password that sets up & activates the study.
 */

import { STUDY_URL } from '../../config';
import React, { PureComponent } from 'react';
import { unswallow } from '../../Utils';
import type { $UnswallowedFn } from '../../Utils';
import AuthView from './AuthView';

// Configure types.
type Props = {
    +onAuthSucceeded: (string, string, string) => void,
    +onStartTest?: (string) => void
};
type State = {
    +currentPassword: string,
    +currentDeviceId: string,
    +error?: string
};

// Studies setup parameters with password.
// If you need to generate a new password, you can use the following shell
// command: `LC_ALL=C tr -dc 'a-z0-9' </dev/urandom | head -c 6`.
type Study = {
    +modality: string,
    +password: string,
    +awareStudyUrl: string
};
const DAILY_TASK_STUDY: Study = {
    modality: 'daily',
    password: '4wc2uw',
    awareStudyUrl: STUDY_URL
};
const WEEKLY_TASK_STUDY: Study = {
    modality: 'weekly',
    password: 'f32bts',
    awareStudyUrl: STUDY_URL
};
const TEST_SCENARIO_PASSWORD: string = '371olh';

// Configure component logic.
export default class AuthController extends PureComponent<Props, State> {

    constructor(props: Props) {
        super(props);

        // Check the correct properties were called.
        if (typeof props.onAuthSucceeded !== 'function') {
            throw new Error('<Auth> `onAuthSucceeded` property should be a function.');
        }
        if (typeof props.onStartTest !== 'undefined' && typeof props.onStartTest !== 'function') {
            throw new Error('<Auth> `onStartTest` property should be a function or be undefined.');
        }

        // Set the initial state.
        this.state = {
            currentPassword: '',
            currentDeviceId: '',
            error: undefined,
        };

        // Ensure uncaught exception within potential async callback properties
        // are logged and not swallowed by promise.
        this.onAuthSucceeded = unswallow(this.props.onAuthSucceeded);
        this.onStartTest = unswallow(this.props.onStartTest);
    }

    // Wrapped user-defined callbacks with async error handler.
    onAuthSucceeded: $UnswallowedFn<Props, 'onAuthSucceeded'>;
    onStartTest: $UnswallowedFn<Props, 'onStartTest'>;

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

        // The password can either be a study access password or a password
        // used to generate different application setup for testing purpose. 
        switch (this.state.currentPassword) {
        // If the typed password has been generated in order to setup a testing
        // scenario, trigger the `onStartTest` callback.
        case TEST_SCENARIO_PASSWORD:
            if (typeof this.onStartTest !== 'function') {
                throw new Error('Component <Auth> does not have an onStartTest attribute.');
            }
            else {
                this.onStartTest(this.state.currentDeviceId);
            }
            break;
        // Otherwise, it's probably been generated to access a study.
        case DAILY_TASK_STUDY.password:
            // Trigger initialization on success.
            this.setState({ error: undefined });
            this.onAuthSucceeded(DAILY_TASK_STUDY.modality, this.state.currentDeviceId, DAILY_TASK_STUDY.awareStudyUrl);
            break;
        case WEEKLY_TASK_STUDY.password:
            // Trigger initialization on success.
            this.setState({ error: undefined });
            this.onAuthSucceeded(WEEKLY_TASK_STUDY.modality, this.state.currentDeviceId, WEEKLY_TASK_STUDY.awareStudyUrl);
            break;
        // If the password is simply incorrect, display an error.
        default:
            this.setState({ error: 'code d\'accès erroné' });
            break;
        }

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
