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

import CheckPhenotypingView from './CheckPhenotypingView';
import AwareManager from '../../crossplatform-model/native-db/AwareManager';

// Configure types.
type Props = {
    +onStartAwareClicked: () => void,
    +onStepFinished: () => void,
    +onStartAwareBypassed: () => void,
    +hasAwareStudyBeenJoined: boolean
};
type State = {
    +showActivateAwareButton: boolean
};

// Configure component logic.
export default class CheckPhenotypingController extends PureComponent<Props, State> {

    // Set displayName for debug and bugreport navigation tracing.
    static displayName = 'CheckPhenotyping';

    constructor(props: Props) {
        super(props);

        this.state = {
            showActivateAwareButton: true
        };
    }

    async componentDidMount() {
        // If aware study has already been joined, skip activation step.
        const hasStudyAlreadyBeenJoined = await AwareManager.hasStudyBeenJoined()
        if (hasStudyAlreadyBeenJoined) {
            this.setState({ showActivateAwareButton: false })
        }
    }

    startAware = () => {
        // Assert aware has not already been started.
        // @warning hasAwareStudyBeenJoined can't be false negative in case app
        //     has been restarted because state isn't generated from aware's
        //     owns but local to js only.
        // @todo either store state in local db when aware start or update
        //     aware to be able to retrieve this state.
        if (this.props.hasAwareStudyBeenJoined) {
            throw new Error('shouldn\'t be able to start already started aware');
        }

        // Forward aware start logic to main controller.
        this.props.onStartAwareClicked();

        // Hide activate aware button.
        this.setState({
            showActivateAwareButton: false
        });
    }

    bypassAware = () => {
        this.props.onStartAwareBypassed();
    }

    finishStep = () => {
        this.props.onStepFinished();
    }

    render() {
        const showFinishStepButton = this.props.hasAwareStudyBeenJoined;

        return (
            <CheckPhenotypingView
                showActivateAwareButton={this.state.showActivateAwareButton}
                onActivateAware={this.startAware}
                onActivateAwareLongPress={this.bypassAware}
                showFinishStepButton={showFinishStepButton}
                finishStep={this.finishStep}
            />
        );
    }

}
