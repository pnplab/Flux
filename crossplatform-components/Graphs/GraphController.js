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

import GraphMenuView from './GraphMenuView';

// Configure types.
type Props = {
    +menu: 'usage' | 'symptoms'
};
type State = {

};

// Configure component logic.
class GraphController extends PureComponent<Props, State> {

    static defaultProps = {

    };

    constructor(props) {
        super(props);

        this.state = {

        };
    }

    render() {
        return (
            <GraphMenuView 
                menu={this.props.menu}
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
)(React.memo(GraphController));
