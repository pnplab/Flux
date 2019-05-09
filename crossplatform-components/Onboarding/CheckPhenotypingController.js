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
    +studyPassword: string,
    +participantId: string,
    +confirmPhenotyping: () => void,
    +initializeStudy: (string, string) => void
};
type State = {
    +step: 'activate-aware' | 'next'
};

// Configure component logic.
class CheckPhenotypingController extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            step: 'activate-aware'
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
        
        // Initialize aware.
        this.props.initializeStudy(studyPassword, participantId);

        // @note Use a setTimeout to make sure setState is done after the study 
        // is initialized. The button will thus change only when the study has
        // been initialized! This works as initializeStudy is done 
        // sequencialy (but in 'js asynchronicty', on the js queue).
        setTimeout(() => {
            this.setState({ step: 'next' });
        });
    }

    // Go to next step when the user pushes the submit button!
    onSubmit = () => {
        this.props.confirmPhenotyping();
    }

    render() {
        return (
            <CheckPhenotypingView
                onActivateAware={this.state.step === 'activate-aware' && this.onActivateAware}
                onNext={this.state.step === 'next' && this.onSubmit}
            />
        );
    }

}

// Bind comoponent to redux.
const mapStateToProps = (state: AppState /*, ownProps*/) => ({
    studyPassword: state.onboarding.studyPassword,
    participantId: state.onboarding.participantId,
});

const mapDispatchToProps = {
    initializeStudy: onboarding.initializeStudy,
    confirmPhenotyping: onboarding.confirmPhenotyping
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CheckPhenotypingController);
