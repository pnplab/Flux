/**
 * React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */

import React, { Component } from 'react';
import { Alert } from 'react-native';

import AwareManager from './crossplatform-model/native-db/AwareManager';

// import Router from './crossplatform-components/Router';
import { triggerUpdateIfNeeded } from './Updater.js';

import {
    App,
    Onboarding, Auth, CheckWifi, CheckPermissions, CheckPhenotyping, OnboardingSurveyTask, OnboardingRestingStateTask, CheckDataSync, OnboardingEnd,
    Home
} from './crossplatform-components';

// -- About routing
//
// @note *We do not use router*, instead we only use redux to avoid having
//         multiple source of thruth, as we've faced the same challenges
//         referenced in
//         `https://stackoverflow.com/questions/48893490/react-router-vs-redux-first-routing`
//         in a previous version of the source code. We use a framework similar
//         to the one mentioned in this article
//         `https://medium.freecodecamp.org/an-introduction-to-the-redux-first-routing-model-98926ebf53cb`,
//         although no the same one, as the one we use has a higher community
//         spread & is compatible with react-native such as it doesn't
//         necessarily rely on browser history, but can rely on mobile native
//         mechanism for backward/forward navigation instead. See
//         `https://github.com/respond-framework/rudy/blob/master/packages/rudy/docs/react-native.md`.
//  
// @warning Rudy's documentation (the redux router) is partly out of date.

// -- About theme and components
// 
// @note We use native-base-theme library modified to use iOS style theme on
//         both android & ios. The native-base-theme's theme is located in the
//         `./crossplatform/theme` folder.


export default () => 
    <App index={Onboarding}>
        { 
            ({ 
                goTo
            }) => 
            <>
                <Onboarding index={OnboardingEnd} bypass>
                { 
                    ({
                        goToStep,
                        setDeviceId, deviceId, 
                        listenAwareDataSync, unlistenAwareDataSync, awareDataSyncEvents
                    }) =>
                    <>
                        <Auth
                            onStepFinished={
                                (deviceId, studyId) => 
                                    setDeviceId(deviceId) &
                                    goToStep(CheckWifi)
                            }
                        />
                        <CheckWifi
                            onStepFinished={() => goToStep(CheckPermissions)}
                        />
                        <CheckPermissions
                            onStepFinished={() => goToStep(CheckPhenotyping)}
                        />
                        <CheckPhenotyping
                            deviceId={deviceId || "default"}
                            onAwareStarting={() => undefined /*listenAwareDataSync()*/}
                            onStepFinished={() => goToStep(OnboardingSurveyTask)}
                        />
                        <OnboardingSurveyTask
                            onStepFinished={() => goToStep(OnboardingRestingStateTask)}
                        />
                        <OnboardingRestingStateTask
                            onStepFinished={() => goToStep(OnboardingEnd)}
                        />
                        {/*
                        <CheckDataSync
                            dataSyncEvents={awareDataSyncEvents}
                            onStepFinished={() =>
                                unlistenAwareDataSync() &
                                goToStep(OnboardingEnd)
                            }
                        />
                        */}
                        <OnboardingEnd onStepFinished={() => goTo(Home)} />
                    </>
                }
                </Onboarding>
                <Home />
                {/*
                <SurveyTask />
                <PrepareRestingStateTask />
                <RestingStateTask />
                <Graphs menu="symptoms" />
                <SymptomGraph />
                */}
            </>
        }
    </App>;

// @note `AwareManager.startAware()` is set in the StudySchemaAdapter
// @todo rename StudySchemaAdapter to InitAppSchemaAdapter.

// Add aware-related debugging tools to dev menu
if (__DEV__ || !__DEV__) {
    const DevMenu = require('react-native-dev-menu');

    DevMenu.addItem('aware: device id', async () => {
        let deviceId = await AwareManager.getDeviceId();

        Alert.alert(
          'AWARE Device ID',
          deviceId,
          [
            { text: 'OK' },
          ],
        );

    });

    DevMenu.addItem('aware: sync', () => AwareManager.syncData());
}

// Check environment variables.
if (typeof process.env.FLUX_ENCRYPTION_KEY === 'undefined') {
    throw new Error('FLUX_ENCRYPTION_KEY must be set! Don\'t forget to flush cache (`react-native start --reset-cache`)! In case of `./gradlew assembleRelease`, run `./gradlew clean` & use export prior to env-variable-prefixed bash command!');
}

// Automatically update the app when released
if (typeof process.env.FLUX_AUTO_UPDATE !== 'undefined' && process.env.FLUX_AUTO_UPDATE == true) {
    triggerUpdateIfNeeded();
}
