/*
 * @flow
 */

import React, { PureComponent } from 'react';
import type { Component, ComponentType } from 'react';

import { StatusBar } from 'react-native';
import { StyleProvider } from 'native-base';
import { getTheme } from '../crossplatform-theme/';

import { isFragment } from 'react-is';
import BugReporter from '../crossplatform-model/native-db/BugReporter';
import AwareManager from '../crossplatform-model/native-db/AwareManager';
import GraphManager from '../crossplatform-model/persistent-db/GraphManager';
import UserManager from '../crossplatform-model/persistent-db/UserManager';

// Configure types.
type Props = {|
    +children: ({ [key: string]: any }) => Component<any, any>,
    +index: ComponentType<any>
|};
type State = {|
    activeComponentType: ComponentType<any>,
    hasAwareStudyBeenJoined: boolean,
    userSettings?: {|
        +studyModality: 'daily' | 'weekly',
        +awareDeviceId: string,
        +awareStudyUrl: string,
        +lastSubmittedSurveyTaskTimestamp: number,
        +lastSubmittedRestingStateTaskTimestamp: number
    |}
|};

// Configure component logic.
export default class AppController extends PureComponent<Props, State> {

    constructor(props: Props) {
        super(props);

        this.state = {
            activeComponentType: this.props.index,
            hasAwareStudyBeenJoined: false,
            userSettings: undefined
        };
    }

    goTo = (componentType: ComponentType<any>) => {
        // Retrieve current component name. We can't compare from ECMA import
        // or use `contructor.name` because of code minification process. Thus
        // we use displayName react property. It should be set for all
        // component!
        let componentName = componentType.displayName;

        // Trace component navigation for precise bug reporting.
        if (typeof componentName === 'undefined' || componentName === null) {
            console.warn('unknown component name for bug reporting on AppController#goTo');
            BugReporter.breadcrumb('unknown', 'navigation');
        }
        else {
            BugReporter.breadcrumb(componentName, 'navigation');
        }

        // Switch shown component.
        this.setState({ activeComponentType: componentType });
    }

    render() {
        // Retrieve returned components from render prop function.
        const childFunctionResult = this.props.children({
            activeComponent: this.state.activeComponentType,
            goTo: this.goTo,
            startAware: this.startAware,
            joinAwareStudy: this.joinAwareStudy,
            hasAwareStudyBeenJoined: this.state.hasAwareStudyBeenJoined,

            // Register the app configuration into this single user settings.
            // These data are used to define the study modality (eg. daily or
            // weekly tasks for user, etc.) and aware settings (device id and
            // study url).
            userSettings: this.state.userSettings,
            setUserSettings: this.setUserSettings,
            setAndStoreUserSettings: this.setAndStoreUserSettings,

            storeSurvey: this.storeSurvey,
            storeRestingState: this.storeRestingState
        });

        // Retrieve returned fragment's children as an array
        const fragmentChild = React.Children.only(childFunctionResult);
        const children = isFragment(fragmentChild) ? React.Children.toArray(fragmentChild.props.children) : [ fragmentChild ];

        // Pick up the current component type to display.
        const activeComponentType = this.state.activeComponentType;

        // Retrieve the component instance to display.
        const shownComponent = children.filter(child => child.type === activeComponentType)[0];

        // Wrap component.
        const wrappedComponent =
            <StyleProvider style={getTheme()}>
                <>
                    <StatusBar backgroundColor="#FAFAFA" barStyle="dark-content" />
                    {shownComponent}
                </>
            </StyleProvider>;

        // Display component.
        return wrappedComponent;
    }

    storeSurvey = async (msTimestamp: number, values: {| [questionId: string]: number |}) => {
        // @note we use a redundant database architecture instead of a single
        // source of thruth one because of the complexity of implementing
        // abstraction binding between the native part for both android and iOS
        // and javascript. Indeed, we rely solely on Aware backend and its
        // inner mechanism for data synchronization with data that are out of
        // is scope of concerns (which was a mistake, a dual backend would
        // have made more sense and be easier to maintain).

        // Store in aware.
        /* await */ AwareManager.storeSurvey(msTimestamp, values);

        // Store in realm for graphs.
        /* await */ GraphManager.storeSurvey(msTimestamp, values);
    }

    storeRestingState = async () => {
        // ...the data are automatically stored to Aware in the native side
        // through the RestingStateTaskController which contains a binder to
        // java's code.

        // Thus this method is not to be used. It is used to document the
        // contrasting behavior with the storeSurvey one.
        throw new Error('storeRestingState implemented in java code. not in javascript code.');
    }

    startAware = async (awareDeviceId: string) => {
        // assert device id.
        if (!awareDeviceId) {
            throw new Error('awareDeviceId should be defined!');
        }

        // Request aware's mandatory permission. Should do nothing as they
        // already have been requested in onboarding step!
        // @todo redirect to onboarding request permission step if permissions
        //    aren't granted! Must be checked outside this method as this one
        //    is only called during onboarding though.
        await AwareManager.requestPermissions();

        // Initialize aware.
        AwareManager.startAware(awareDeviceId);
    }

    joinAwareStudy = async (awareStudyUrl: string) => {
        //                !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        // @warning @todo !!! Will make the app stuck if study fails !!!
        //                !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

        // Join study.
        await AwareManager.joinStudy(awareStudyUrl);

        // Change button from 'start aware' to 'go to next step' in
        // CheckPhenotypingController.
        this.setState({ hasAwareStudyBeenJoined: true });
    }

    setUserSettings = (userSettings: {|
        studyModality: 'daily' | 'weekly',
        awareDeviceId: string,
        awareStudyUrl: string,
        lastSubmittedSurveyTaskTimestamp: number,
        lastSubmittedRestingStateTaskTimestamp: number
    |}) => {
        this.setState({ userSettings });
    }

    setAndStoreUserSettings = async (
        config: {|
            studyModality: 'daily' | 'weekly',
            awareDeviceId: string,
            awareStudyUrl: string
        |} | {|
            lastSubmittedSurveyTaskTimestamp: number
        |} | {|
            lastSubmittedRestingStateTaskTimestamp: number
        |}
    ) => {
        // Register all the user specific settings information required for the
        // regular app behavior (aware, survey, notifications, ...).
        let configKeyCount = Object.keys(config).length;
        if (configKeyCount === 3 && typeof config.studyModality !== 'undefined' && typeof config.awareDeviceId !== 'undefined' && typeof config.awareStudyUrl !== 'undefined') {
            let { studyModality, awareDeviceId, awareStudyUrl } = config;
            await UserManager.setupUser(studyModality, awareDeviceId, awareStudyUrl);
        }
        // Register last survey task timestamp so home controller know which
        // task to suggest.
        else if (configKeyCount === 1 && typeof config.lastSubmittedSurveyTaskTimestamp !== 'undefined') {
            let { lastSubmittedSurveyTaskTimestamp } = config;
            await UserManager.setLastSubmittedSurveyTaskTimestamp(lastSubmittedSurveyTaskTimestamp);
        }
        // Register last survey task timestamp so home controller know which
        // task to suggest.
        else if (configKeyCount === 1 && typeof config.lastSubmittedRestingStateTaskTimestamp !== 'undefined') {
            let { lastSubmittedRestingStateTaskTimestamp } = config;
            await UserManager.setLastSubmittedRestingStateTaskTimestamp(lastSubmittedRestingStateTaskTimestamp);
        }
        // Throw an exception if an unexpected use of the method is made.
        else {
            throw new Error('Invalid config object for user settings.');
        }

        // Propagate user settings to the app.
        let userSettings = await UserManager.getUserSettings();
        this.setState({ userSettings });
    }

}
AppController.displayName = 'AppController';