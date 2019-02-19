/*
 * @flow
 *
 * @description
 * Startup screen, showing the button to access the survey depending on the
 * time.
 */

import type { Question } from '../../crossplatform-model/immutable-db/QuestionType';
import type { State as AppState } from '../../crossplatform-model/memory-db/types';
import { symptomGraph } from '../../crossplatform-model/memory-db/actions';
const { toggleSymptom, loadSymptoms, openGraph } = symptomGraph;

import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import QuestionData from '../../crossplatform-model/immutable-db/QuestionData';
import SymptomGraphMenuView from './SymptomGraphMenuView';

// Configure types.
type Props = {
    +checkedSymptomIds: $PropertyType<$PropertyType<AppState, 'symptomGraph'>, 'symptomIds'>,
    +toggleSymptom: typeof toggleSymptom,
    +loadSymptoms: typeof loadSymptoms,
    +openGraph: typeof openGraph,
};
type State = {

};

// Configure component logic.
class SymptomGraphMenuController extends PureComponent<Props, State> {

    static defaultProps = {

    };

    constructor(props) {
        super(props);

        this.state = {

        };
    }

    symptoms: Array<Question> = QuestionData.toJS();

    onSymptomCheckboxPressed = (id: string): void => {
        // Toggle symptom.
        this.props.toggleSymptom(id);
        this.props.loadSymptoms();
    }

    onSubmit = (): void => {
        // Open symptom graph.
        this.props.openGraph();
    }

    render() {
        return (
            <SymptomGraphMenuView 
                symptoms={this.symptoms}
                checkedSymptomIds={this.props.checkedSymptomIds}
                onSymptomCheckboxPressed={this.onSymptomCheckboxPressed}
                onSubmit={this.onSubmit}
            />
        );
    }

}

// Bind comoponent to redux.
const mapStateToProps = (state: AppState /*, ownProps*/) => ({
    checkedSymptomIds: state.symptomGraph.symptomIds
});

const mapDispatchToProps = {
    toggleSymptom: toggleSymptom,
    loadSymptoms: loadSymptoms,
    openGraph: openGraph
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(React.memo(SymptomGraphMenuController));
