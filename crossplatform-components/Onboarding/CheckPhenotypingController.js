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

// Configure types.
type Props = {
    +onStartAwareClicked: () => void,
    +onStepFinished: () => void,
    +onStartAwareBypassed: () => void,
    +hasAwareStudyBeenJoined: boolean
};
type State = {
    +showOnActivateAwareButton: boolean
};

// Configure component logic.
export default class CheckPhenotypingController extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            showOnActivateAwareButton: true
        };
    }

    componentDidMount() {

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
            showOnActivateAwareButton: false
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
                showOnActivateAwareButton={this.state.showOnActivateAwareButton}
                onActivateAware={this.startAware}
                onActivateAwareLongPress={this.bypassAware}
                showFinishStepButton={showFinishStepButton}
                finishStep={this.finishStep}
            />
        );
    }

}
