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
import AwareManager from '../../crossplatform-model/native-db/AwareManager';

import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

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
    constructor(props) {
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

// // Bind comoponent to redux.
// const mapStateToProps = (state: AppState /*, ownProps*/) => ({
//     studyId: state.onboarding.studyId,
//     deviceId: state.onboarding.deviceId,
//     hasAwareStudyBeenJoined: state.onboarding.hasAwareStudyBeenJoined
// });

// const mapDispatchToProps = {
//     initializeStudy: onboarding.initializeStudy,
//     onAwareStarted: onboarding.onAwareStarted
// };

// export default connect(
//   mapStateToProps,
//   mapDispatchToProps
// )(CheckPhenotypingController);
