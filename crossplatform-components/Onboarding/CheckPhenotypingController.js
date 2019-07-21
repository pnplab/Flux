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
    +hasAwareStudyBeenJoined: boolean
};
type State = {
};

// Configure component logic.
export default class CheckPhenotypingController extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            
        };
    }

    componentDidMount() {

    }

    render() {
        return (
            <CheckPhenotypingView
                onActivateAware={!this.props.hasAwareStudyBeenJoined && this.props.onStartAwareClicked}
                onNext={this.props.hasAwareStudyBeenJoined && this.props.onStepFinished}
            />
        );
    }

}
