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

import AwareManager from '../../crossplatform-model/native-db/AwareManager';
import CheckPhenotypingView from './CheckPhenotypingView';

// Configure types.
type Props = {
    +onStartAwareClicked: () => Promise<void>,
    +onStepFinished: () => void,
    +onStartAwareBypassed: () => void
};
type State = {
    +showActivateAwareButton: boolean,
    +showFinishStepButton: boolean
};

// Configure component logic.
export default class CheckPhenotypingController extends PureComponent<Props, State> {

    // Set displayName for debug and bugreport navigation tracing.
    static displayName = 'CheckPhenotyping';

    constructor(props: Props) {
        super(props);

        this.state = {
            showActivateAwareButton: true,
            showFinishStepButton: false
        };
    }

    async componentDidMount() {
        // If aware study has already been joined, skip activation step.
        const hasStudyAlreadyBeenJoined = await AwareManager.hasStudyBeenJoined();
        if (hasStudyAlreadyBeenJoined) {
            this.setState({
                showActivateAwareButton: false,
                showFinishStepButton: true
            });
        }
    }

    startAware = async () => {
        // Forward aware start logic to main controller.
        try {
            await this.props.onStartAwareClicked();

            // Hide activate aware button and show next step button instead.
            this.setState({
                showActivateAwareButton: false,
                showFinishStepButton: true
            });
        }
        catch (e) {
            // Do nothing in case of error.
        }
    }

    bypassAware = () => {
        this.props.onStartAwareBypassed();
    }

    finishStep = () => {
        this.props.onStepFinished();
    }

    render() {
        return (
            <CheckPhenotypingView
                showActivateAwareButton={this.state.showActivateAwareButton}
                onActivateAware={this.startAware}
                onActivateAwareLongPress={this.bypassAware}
                showFinishStepButton={this.state.showFinishStepButton}
                finishStep={this.finishStep}
            />
        );
    }

}
