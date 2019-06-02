/*
 * @flow
 */

import type { Route, State as AppState } from '../../crossplatform-model/memory-db/types';

import type { StatelessFunctionalComponent, Node } from 'react';
import React, { Component } from 'react';
import { View, Text } from "react-native";
import { connect } from 'react-redux';

import { Auth, CheckWifi, CheckPermissions, CheckPhenotyping, OnboardingSurveyTask, OnboardingRestingStateTask, CheckDataSync } from '../Onboarding';
import Home from '../Home';
import Graphs from '../Graphs';
import SymptomGraph from '../Graphs/SymptomGraphController';
import SurveyTask from '../SurveyTask';
import PrepareRestingStateTask from '../RestingStateTask/PrepareRestingStateController';
import RestingStateTask from '../RestingStateTask/RestingStateController';

type Props = {
    +route: Route
};

const Router: StatelessFunctionalComponent<Props> = (props: Props): Node => {
    switch (props.route) {
        case undefined:
            // We do not know yet the current route. This happens for instance
            // when we want to check in the local db at app launch time if the
            // study has already been initialized, in order to redirect the
            // user to the correct route.
            // This route will automatically redirect through redux's reducer
            // once async init data have been loaded from local db.

            // @todo Show loading screen instead.
            return <View><Text>Loading...</Text></View>;
        case '/onboarding/auth':
            return <Auth />;
        case '/onboarding/check/wifi':
            return <CheckWifi />;
        case '/onboarding/check/permissions':
            return <CheckPermissions />;
        case '/onboarding/check/phenotyping':
            return <CheckPhenotyping />;
        case '/onboarding/task/survey':
            return <OnboardingSurveyTask />;
        case '/onboarding/task/resting-state':
            return <OnboardingRestingStateTask />;
        case '/onboarding/check/data-sync':
            return <CheckDataSync />;
        case '/onboarding/finish':
            return <OnboardingEnd />;
        case '/':
            return <Home />;
        case '/survey':
            return <SurveyTask />;
        case '/resting-state':
            return <PrepareRestingStateTask />;
        case '/resting-state/video':
            return <RestingStateTask />;
        case '/graph':
            console.warn('deprecated /graph route');
            return <Graphs menu="usage" />;
        case '/graph/usage':
            return <Graphs menu="usage" />;
        case '/graph/symptoms/select':
            return <Graphs menu="symptoms" />;
        case '/graph/symptoms':
            return <SymptomGraph />;
        default:
            console.error('Unhandled route', props.route);
            return <View><Text>Error!</Text></View>; // Prevent flow from linting.
    }
};

// Bind redux to router.
const mapStateToProps = (state: AppState /*, ownProps*/) => ({
    route: state.route
});

export default connect(
    mapStateToProps,
    undefined
)(React.memo<Props>(Router));
