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
import { onboarding, aware } from '../../crossplatform-model/memory-db/actions';
import AwareManager from '../../crossplatform-model/native-db/AwareManager';

import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import CheckPhenotypingView from './CheckPhenotypingView';

// Configure types.
type Props = {
    +studyPassword: string,
    +participantId: string,
    +confirmPhenotyping: () => void,
    +initializeStudy: (string, string) => void,
    +isAwareStudyJoined: boolean
};
type State = {
    +step: 'activate-aware' | 'next'
};

// Configure component logic.
class CheckPhenotypingController extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            
        };
    }

    componentDidMount() {
        // assert props.
        if (!this.props.studyPassword || !this.props.participantId) {
            throw new Error('studyPassword & participantId should have been set during Auth step!');
        }
    }

    // Activate aware!
    onActivateAware = () => {
        const { studyPassword, participantId } = this.props;

        // Listen to data sync events so we can use them to assess sync is
        // working during the check data sync onboarding process. Note we have
        // no control over when these data sync happens since it's controlled
        // by the android operating system (which optimise for battery usage
        // aso), although it usually happens as soon as the study is launched!
        this.props.listenDataSync();
        
        // Initialize aware.
        this.props.initializeStudy(studyPassword, participantId);
    }

    // Go to next step when the user pushes the submit button!
    onSubmit = () => {
        this.props.confirmPhenotyping();
    }

    render() {
        return (
            <CheckPhenotypingView
                onActivateAware={!this.props.isAwareStudyJoined && this.onActivateAware}
                onNext={this.props.isAwareStudyJoined && this.onSubmit}
            />
        );
    }

}

// Bind comoponent to redux.
const mapStateToProps = (state: AppState /*, ownProps*/) => ({
    studyPassword: state.onboarding.studyPassword,
    participantId: state.onboarding.participantId,
    isAwareStudyJoined: state.onboarding.isAwareStudyJoined
});

const mapDispatchToProps = {
    initializeStudy: onboarding.initializeStudy,
    confirmPhenotyping: onboarding.confirmPhenotyping,
    listenDataSync: aware.listenDataSync,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CheckPhenotypingController);
