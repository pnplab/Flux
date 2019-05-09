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
import { onboarding } from '../../crossplatform-model/memory-db/actions'

import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import OnboardingSurveyTaskView from './OnboardingSurveyTaskView';
import { SurveyTaskController } from '../SurveyTask/SurveyTaskController';


// Configure types.
type Props = {

};
type State = {

};

// Configure component logic.
export default class OnboardingSurveyTaskController extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {

        };
    }

    render() {
        return (
            <OnboardingSurveyTaskView
                onStartTask={this.props.onStartTaskClicked}
                onBypassTask={this.props.onStepBypassed}
            />
        );
    }

}

// // Bind comoponent to redux.
// const mapStateToProps = (state: AppState /*, ownProps*/) => ({

// });

// const mapDispatchToProps = {
//     submitSurveyTaskForm: onboarding.submitSurvey,
//     goToNextStep: onboarding.confirmSurveyTask
// };

// export default connect(
//   mapStateToProps,
//   mapDispatchToProps
// )(OnboardingSurveyTaskController);
