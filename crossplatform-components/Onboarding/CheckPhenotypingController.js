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
    +deviceId: string,
    +onAwareStarting: () => void,
    +onStepFinished: () => void,
};
type State = {
    +hasAwareStudyBeenJoined: boolean
};

// Configure component logic.
export default class CheckPhenotypingController extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            hasAwareStudyBeenJoined: false
        };
    }

    componentDidMount() {
        // assert props.
        if (!this.props.deviceId) {
            throw new Error('deviceId should have been set during Auth step!');
        }
        
        // Ensure encryption key has been set through process' env variable.
        if (typeof process.env.FLUX_ENCRYPTION_KEY === 'undefined') {
            throw new Error('process.env.FLUX_ENCRYPTION_KEY is undefined!');
        }
    }

    // Activate aware!
    onActivateAware = async () => {
        const { deviceId } = this.props;
        const encryptionKey = process.env.FLUX_ENCRYPTION_KEY;

        // Allow onboarding to inject code such as starting to listen to aware
        // data sync events for later step. 
        this.props.onAwareStarting();
        
        // Initialize aware.
        await AwareManager.requestPermissions(); // Should do nothing as permission have already been requested in a prior step!
        AwareManager.startAware(deviceId, encryptionKey);

        //                !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        // @warning @todo !!! Will make the app stuck if study fails !!!
        //                !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        // @todo change url based on study.
        await AwareManager.joinStudy('https://www.pnplab.ca/index.php/webservice/index/2/UvxJCl3SC4J3');

        // Change button from 'start aware' to 'go to next step'.
        this.setState({ hasAwareStudyBeenJoined: true });
    }

    // Go to next step when the user pushes the submit button!
    onSubmit = () => {
        this.props.onStepFinished();
    }

    render() {
        return (
            <CheckPhenotypingView
                onActivateAware={!this.state.hasAwareStudyBeenJoined && this.onActivateAware}
                onNext={this.state.hasAwareStudyBeenJoined && this.onSubmit}
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
