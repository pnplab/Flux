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

import OnboardingEndView from './OnboardingEndView';

// Configure types.
type Props = {
};
type State = {
};

// Configure component logic.
export default class OnboardingEndController extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
        };
    }

    componentDidMount() {
    }

    // Go to next step when the user pushes the submit button!
    onSubmit = () => {
        this.props.onStepFinished();
    }

    render() {
        return (
            <OnboardingEndView
                onSubmit={this.onSubmit}
            />
        );
    }

}
