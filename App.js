/**
 * React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React from 'react';
import type { ComponentType } from 'react';
import { Alert } from 'react-native';

import AwareManager from './crossplatform-model/native-db/AwareManager';
import Menu from './crossplatform-components/Menu';
import type { MenuButtonName } from './crossplatform-components/Menu';

// import Router from './crossplatform-components/Router';
import { triggerUpdateIfNeeded } from './Updater.js';
import { DEV, FLUX_AUTO_UPDATE } from './config';

import {
    App,
    AppLoader,
    Onboarding, Auth, CheckWifi, CheckPermissions, CheckPhenotyping, SurveyTaskOnboarding, RestingStateTaskOnboarding, CheckDataSync, OnboardingEnd,
    Home, 
    SurveyTask,
    RestingStateTask
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


// Start aware study
// { (async () => await startAware('test') & await joinAwareStudy())() && null }

// Store survey integration test.
// { (async () => await startAware('test') & await joinAwareStudy() & storeSurvey({ abcd: 0.31 /* empty :D */ }) & AwareManager.disableMandatoryWifiForSync() & AwareManager.disableMandatoryBatteryForSync() & AwareManager.syncData() )() && null }

// Disable yellow box (conosle.warn popups inside the app). It breaks
// integration testing as it sometimes prevent button sitting underneath the
// yellow boxes to be clicked.
// $FlowFixMe
// console.disableYellowBox = true;

/* eslint-disable react/display-name, indent */

// Converts the App's goTo function (which takes a component as an input) into
// Menu's callback function (which takes a string as an input).
type GoToFnType = (ComponentType<any>) => void;
type OnMenuButtonClickedFnType = (buttonName: MenuButtonName) => void;
type GoToFnMenuAdapterType = (goToFn: GoToFnType) => OnMenuButtonClickedFnType;
const goToFnMenuAdapter: GoToFnMenuAdapterType = function(goToFn: GoToFnType): OnMenuButtonClickedFnType {
    // Generate the correct onButtonClicked callback function using the goToFn
    // one.
    return function(buttonName: MenuButtonName): void {
        // Convert the button name (as a string) into component one (as a 
        // component type). The call the goToFn function with the right
        // parameter.
        switch (buttonName) {
            case 'home':
                goToFn(Home);
                break;
            case 'graphs':
                throw new Error('Menu button not implemented yet!');
            case 'info':
                throw new Error('Menu button not implemented yet!');
            case 'notifications':
                throw new Error('Menu button not implemented yet!');
        }
    };
};

// Sets up the app components' dataflow.
export default (): React$Node => 
    <App index={AppLoader}>
    {
        ({
            // Method to switch between displayed components.
            goTo,

            // These methods sets up and passes user settings inbetween App's
            // components. Notably used by the AppLoader at app initialisation.
            setUserSettings,
            userSettings,

            // `setAndStoreUserSettings` stores the app configuration into
            // local db.
            setAndStoreUserSettings,

            // Aware startup methods.
            startAware,
            joinAwareStudy,

            // `hasAwareStudyBeenJoined` is only used by onboarding to know
            // when the user can go to the next onboarding step.
            hasAwareStudyBeenJoined,

            // storeSurvey store the survey both remotely (through Aware) and 
            // locally (for graphs).
            storeSurvey,

            // ...no need for storeRestingState as this is done in the java
            // side (cf. comments bellow at the RestingStateTask component).
        }) => 
        <>
            <AppLoader
                onUserNotYetRegistered={
                    () => {
                        // Log current state.
                        console.info('User not yet registered.');

                        // Launch onboarding so the user can configurs the app
                        // settings.
                        goTo(Onboarding);
                    }
                }
                onUserAlreadyRegistered={
                    async (userSettings) => {
                        // Log current state.
                        console.info(`
                            User retrieved with
                            studyModality=${userSettings.studyModality}
                            awareDeviceId=${userSettings.awareDeviceId}
                            awareStudyUrl=${userSettings.awareStudyUrl}
                            lastSubmittedSurveyTaskTimestamp=${userSettings.lastSubmittedSurveyTaskTimestamp}
                            lastSubmittedRestingStateTaskTimestamp=${userSettings.lastSubmittedRestingStateTaskTimestamp}.
                        `.replace(/ {4}/g, ''));

                        // Share the loaded user settings with the rest of the
                        // app.
                        setUserSettings(userSettings);

                        // Go to the home screen as app is loaded.
                        goTo(Home);

                        // Start and setup aware background service.
                        // Probably unnecesseray, since aware should be kept
                        // launched independently from the app, restarted on 
                        // crash, and even restarted automatically at phone
                        // boot. But for safety..
                        await startAware(userSettings.awareDeviceId || 'byp0auth');
                        await joinAwareStudy(userSettings.awareStudyUrl);
                    }
                }
            />

            <Onboarding index={Auth}>
            {
                ({
                    // Method to move across the onboarding steps.
                    goToStep,
                    
                    /* ...the attributes bellow are used to communicate 
                       inbetween onboarding's components... */
                    
                    // Study modality. Used to define the behavior of the app
                    // (eg. whether the user has to do either daily or weekly
                    // tasks).
                    setStudyModality,
                    studyModality,

                    // Device id, set at auth, needed to start aware.
                    setAwareDeviceId,
                    awareDeviceId,

                    // Study id, set at auth, needed to parameter the app
                    // behavior.
                    setAwareStudyUrl,
                    awareStudyUrl
                }) =>
                <>
                    <Auth
                        onStepFinished={
                            (studyModality, awareDeviceId, awareStudyUrl) => {
                                // Set study values temporarily so they can be 
                                // used to start aware in CheckPhenotyping
                                // step and then stored locally in
                                // OnboardingEnd step.
                                setStudyModality(studyModality);
                                setAwareDeviceId(awareDeviceId);
                                setAwareStudyUrl(awareStudyUrl);

                                // Go to next onboarding step.
                                goToStep(CheckWifi);
                            }
                        }
                    />

                    <CheckWifi
                        onStepFinished={
                            () => {
                                // Go to next onboarding step.
                                goToStep(CheckPermissions);
                            }
                        }
                    />

                    <CheckPermissions
                        onStepFinished={
                            () => {
                                // Go to next onboarding step.
                                goToStep(CheckPhenotyping);
                            }
                        }
                    />

                    <CheckPhenotyping
                        hasAwareStudyBeenJoined={hasAwareStudyBeenJoined}
                        onStartAwareClicked={
                            async () => {
                                // Start aware and join study.
                                await startAware(awareDeviceId || 'byp0auth');
                                await joinAwareStudy(awareStudyUrl);
                            }
                        }
                        onStepFinished={
                            () => {
                                // Go to next onboarding step.
                                goToStep(SurveyTaskOnboarding);
                            }
                        }
                    />

                    <SurveyTaskOnboarding
                        onStartTaskClicked={
                            () => {
                                // Go to next onboarding step.
                                goToStep(SurveyTask);
                            }
                        }
                        onStepBypassed={
                            () => {
                                // We provide a way to bypass this task as it's
                                // hard to develop a good e2e test for this one
                                // (screen scrolling fails in appium for some
                                // reason).

                                // Store fake survey values remotely so we can 
                                // check if the sync as occured correctly in 
                                // the CheckDataSync step.
                                storeSurvey({ fake: 0.1, fake2: 0.6, fake3: 0.4 });

                                // Go to next onboarding step.
                                goToStep(RestingStateTaskOnboarding);
                            }
                        }
                    />

                    <SurveyTask
                        onSubmit={ 
                            (msTimestamp, values) => {
                                // Store survey values remotely so we can check
                                // if the sync as occured correctly in the
                                // CheckDataSync step.
                                storeSurvey(values);

                                // Go to next onboarding step.
                                goToStep(RestingStateTaskOnboarding);
                            }
                        }
                    />

                    <RestingStateTaskOnboarding
                        onStartTask={
                            () => {
                                // Go to next onboarding step.
                                goToStep(RestingStateTask);
                            }
                        }
                        onBypassTask={
                            () => {
                                // We provide a way to bypass this task as the
                                // required Muse eeg devices are not available
                                // from AWS Device Farm for e2e
                                // continuous-deployment testing.

                                // Go to next onboarding step.
                                goToStep(CheckDataSync);
                            }
                        }
                    />

                    <RestingStateTask
                        onTaskFinished={
                            () => {
                                // ...data are stored through java's code.

                                // Go to next onboarding step.
                                goToStep(CheckDataSync);
                            }
                        }
                    />

                    <CheckDataSync
                        onStepFinished={
                            () => {
                                // Go to next onboarding step.
                                goToStep(OnboardingEnd);
                            }
                        }
                    />

                    <OnboardingEnd
                        onStepFinished={
                            async () => {
                                // Set user settings as they will be useful
                                // for Home to know which task to display and
                                // store them in local db.
                                await setAndStoreUserSettings({ studyModality, awareDeviceId, awareStudyUrl });

                                // Go to Home as app's onboarding is over.
                                goTo(Home);
                            }
                        }
                    />
                </>
            }
            </Onboarding>

            <Home
                studyModality={userSettings && userSettings.studyModality}
                lastSubmittedSurveyTimestamp={userSettings && userSettings.lastSubmittedSurveyTimestamp}
                lastSubmittedRestingStateTaskTimestamp={userSettings && userSettings.lastSubmittedRestingStateTaskTimestamp}
                onStartSurveyTask={
                    () => {
                        // Go to Survey task.
                        goTo(SurveyTask);
                    }
                }
                onStartRestingStateTask={
                    () => {
                        // Go to Resting State task.
                        goTo(RestingStateTask);
                    }
                }
                menuComponent={<Menu activeButton="home" onButtonClicked={goToFnMenuAdapter(goTo)} />}
            />

            <SurveyTask
                onSubmit={
                    async (msTimestamp, values) => {
                        // Store survey to Aware for server sync and locally in
                        // realm for graphs
                        storeSurvey(values);

                        // Store task timestamp so we don't allow user to do it
                        // again through Home screen.
                        await setAndStoreUserSettings({ lastSubmittedSurveyTaskTimestamp: msTimestamp });

                        // Switch to home screen as task is finished.
                        goTo(Home);
                    }
                }
            />

            <RestingStateTask
                onTaskPostponed={
                    () => {
                        // Switch to home screen.
                        goTo(Home);
                    }
                }
                onTaskFinished={
                    async (msTimestamp) => {
                        // ...resting state eeg data are already stored inside aware through java code (bound from
                        // RestingStateTask component's code). Can't be done any other way due to high frequency 
                        // real time constraints of eeg recording.

                        // Store task timestamp so we don't allow user to do it
                        // again through Home screen.
                        await setAndStoreUserSettings({ lastSubmittedRestingStateTaskTimestamp: msTimestamp });

                        // Switch to home screen as task is finished.
                        goTo(Home);
                    }
                }
            />
        </>
    }
    </App>;
/* eslint-enable react/display-name, indent */

// Add aware-related debugging tools to dev menu.
if (DEV || !DEV) {
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

// Automatically update the app when released.
if (typeof FLUX_AUTO_UPDATE !== 'undefined' && FLUX_AUTO_UPDATE === 'true') {
    triggerUpdateIfNeeded();
}
