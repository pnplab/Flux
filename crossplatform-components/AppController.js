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
import AwareManager from '../crossplatform-model/native-db/AwareManager';
import GraphManager from '../crossplatform-model/persistent-db/GraphManager';

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
            shownComponentType: this.props.index,
            hasAwareStudyBeenJoined: false
        };
    }

    render() {
        // Retrieve returned components from render prop function.
        const childFunctionResult = this.props.children({
            goTo: (componentType) => this.setState({ shownComponentType: componentType }),
            startAware: this.startAware,
            joinAwareStudy: this.joinAwareStudy,
            hasAwareStudyBeenJoined: this.state.hasAwareStudyBeenJoined,
            storeSurvey: this.storeSurvey,
            setHomeScreenMode: () => console.warn('unimplemented!')
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

    storeSurvey = async (values: { [questionId: string]: number }) => {
        // Get current timestamp to date the form.
        const currentTimestamp = new Date().getTime();

        // Store in aware.
        /* await */ AwareManager.storeSurvey(currentTimestamp, values);

        // Store in realm for graphs.
        /* await */ GraphManager.storeSurvey(currentTimestamp, values);
    }

    startAware = async (deviceId) => {
        // assert device id.
        if (!deviceId) {
            throw new Error('deviceId should be defined!');
        }

        // Request aware's mandatory permission. Should do nothing as they 
        // already have been requested in onboarding step!
        // @todo redirect to onboarding request permission step if permissions
        //    aren't granted! Must be checked outside this method as this one 
        //    is only called during onboarding though.
        await AwareManager.requestPermissions();

        // Initialize aware.
        AwareManager.startAware(deviceId);
    }

    joinAwareStudy = async () => {
        //                !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        // @warning @todo !!! Will make the app stuck if study fails !!!
        //                !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        // @todo change url based on study.

        // Retrieve study url from env (so we can use 10.0.2.2 android-studio 
        // debugger's proxy on local debug server & pnplab.ca on official app).
        if (typeof process.env.STUDY_URL === 'undefined') {
            throw new Error('Undefined STUDY_URL in env!');
        }
        const studyUrl = process.env.STUDY_URL;

        await AwareManager.joinStudy(studyUrl);

        // Change button from 'start aware' to 'go to next step' in CheckPhenotypingController.
        this.setState({ hasAwareStudyBeenJoined: true });
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
