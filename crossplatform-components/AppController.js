
/*
 * @flow
 */

import type { State as AppState } from '../../crossplatform-model/memory-db/types';

import React, { PureComponent } from 'react';

import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { StyleProvider } from 'native-base';
import { store } from '../crossplatform-model/memory-db';
import { getTheme } from '../crossplatform-theme/';

import { isFragment } from 'react-is';

// Configure types.
type Props = {
    +children: () => Array<React.Component>,
    +index: React.ComponentType
};
type State = {
};

// Configure component logic.
export default class AppController extends PureComponent<Props, State> {

    constructor(props) {
        super(props);

        this.state = {
            shownComponentType: this.props.index
        };
    }

    render() {
        // Retrieve returned components from render prop function.
        const childFunctionResult = this.props.children({
           goTo: (componentType) => this.setState({ shownComponentType: componentType })
        });

        // Retrieve returned fragment's children as an array
        const fragmentChild = React.Children.only(childFunctionResult);
        const children = isFragment(fragmentChild) ? React.Children.toArray(fragmentChild.props.children) : [ fragmentChild ];
        
        // Pick up the current component type to display.
        const shownComponentType = this.state.shownComponentType;

        // Rertieve the component instance to display.
        const shownComponent = children.filter(child => child.type === shownComponentType)[0];

        // Wrap component.
        const wrappedComponent = 
            <StyleProvider style={getTheme()}>
                <Provider store={store}>
                    <StatusBar backgroundColor="#FAFAFA" barStyle="dark-content" />
                    {shownComponent}
                </Provider>
            </StyleProvider>;

        // @todo Check if OnboardingController is willing to delegate it's routing process to AppController.

        // Display component.
        return wrappedComponent;
    }

}

// // @todo bind this with route.
// const AppRouter = ({ children }) => {
// };
// 
// // Bind comoponent to redux.
// const mapStateToProps = (state: AppState /*, ownProps*/) => ({
// 
// });
// 
// const mapDispatchToProps = {
// 
// };
// 
// export default connect(
//   mapStateToProps,
//   mapDispatchToProps
// )(AppController);
