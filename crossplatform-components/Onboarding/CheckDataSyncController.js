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

import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import CheckDataSyncView from './CheckDataSyncView';

// Configure types.
type Props = {
};
type State = {
};

// Configure component logic.
class CheckDataSyncController extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
        };
    }

    componentDidMount() {
    }

    // Go to next step when the user pushes the submit button!
    onSubmit = () => {

    }

    render() {
        return (
            <CheckDataSyncView
                onSubmit={this.onSubmit}
            />
        );
    }

}

// Bind comoponent to redux.
const mapStateToProps = (state: AppState /*, ownProps*/) => ({

});

const mapDispatchToProps = {

};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CheckDataSyncController);
