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
import AuthView from './AuthView';

// Configure types.
type Props = {
    +onStepFinished: (string, string, string) => void,
};
type State = {
    +currentPassword: string,
    +currentDeviceId: string,
    error?: string
};

type Study = {
    +modality: string,
    +password: string,
    +awareStudyUrl: string
}
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

// Configure component logic.
export default class AuthController extends PureComponent<Props, State> {

    constructor(props: Props) {
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

        // Check password is correct.
        if (this.state.currentPassword !== DAILY_TASK_STUDY.password && this.state.currentPassword !== WEEKLY_TASK_STUDY.password) {
            this.setState({ error: 'code d\'accès erroné' });
            return;
        }
        
        // Retrieve study from typed password.
        let study: Study;
        if (this.state.currentPassword == DAILY_TASK_STUDY.password) {
            study = DAILY_TASK_STUDY;
        }
        else if (this.state.currentPassword == WEEKLY_TASK_STUDY.password) {
            study = WEEKLY_TASK_STUDY;
        }
        else {
            // Should never happen has password have been checked to match one
            // of the study just a few lines above.
            throw new Error('Study not found at auth. It should have been found based on typed password.');
        }

        // Trigger initialization on success.
        this.setState({ error: undefined });
        this.props.onStepFinished(study.modality, this.state.currentDeviceId, study.awareStudyUrl);
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
