/*
 * @flow
 *
 * @description
 * Startup screen, showing the button to access the survey depending on the
 * time.
 */

import type { State as AppState } from '../../crossplatform-model/memory-db/types';

import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import HomeView from './HomeView';
import { startSurveyTask, openRestingStateTask } from '../../crossplatform-model/memory-db/actions';

// Configure types.
type Props = {
    // The surveys can only be filled at certain times, depending on the study !
    +isSurveyTaskAvailable: boolean,
    +isRestingStateTaskAvailable: boolean,
    // Go to the survey's route.
    +startSurveyTask: () => Void,
    +openRestingStateTask: () => Void
};
type State = {
};

// Configure component logic.
class HomeController extends PureComponent<Props, State> {

    static defaultProps = {

    };

    constructor(props) {
        super(props);

        this.state = {

        };

        this.onStartSurveyTaskClicked = this.onStartSurveyTaskClicked.bind(this);
        this.onOpenRestingStateTaskClicked = this.onOpenRestingStateTaskClicked.bind(this);
    }

    onStartSurveyTaskClicked() {
        this.props.startSurveyTask();
    }

    onOpenRestingStateTaskClicked() {
        this.props.openRestingStateTask();
    }

    render() {
        return (
            <HomeView 
                isSurveyTaskAvailable={this.props.isSurveyTaskAvailable}
                isRestingStateTaskAvailable={this.props.isRestingStateTaskAvailable}
                onStartSurveyTaskClicked={this.onStartSurveyTaskClicked}
                onOpenRestingStateTaskClicked={this.onOpenRestingStateTaskClicked}
            />
        );
    }

}

// Bind comoponent to redux.
const mapStateToProps = (state: AppState /*, ownProps*/) => ({
    isSurveyTaskAvailable: state.isSurveyTaskAvailable,
    isRestingStateTaskAvailable: state.isRestingStateTaskAvailable
});

const mapDispatchToProps = {
    startSurveyTask,
    openRestingStateTask
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(React.memo(HomeController));
