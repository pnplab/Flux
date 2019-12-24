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

import BugReporter from './crossplatform-model/native-db/BugReporter';
import AwareManager from './crossplatform-model/native-db/AwareManager';
import NotificationManager from './crossplatform-model/native-db/NotificationManager';
import Menu from './crossplatform-components/Menu';
import type { MenuButtonName } from './crossplatform-components/Menu';

// import Router from './crossplatform-components/Router';
import { DEV } from './config';

import {
    App,
    AppLoader,
    SoftwareUpdate,
    Onboarding,
    Auth,
    CheckWifi,
    RequestPermissionsNotice,
    RequestPermissions,
    RequestBypassDozePrivilege,
    RequestAccessibilityPrivilege,
    RequestsConfirmation,
    DataCollection,
    SurveyTaskOnboarding,
    RestingStateTaskOnboarding,
    CheckDataSync,
    OnboardingEnd,
    Home,
    SurveyTask,
    RestingStateTask
} from './crossplatform-components';

// -- About routing
//
// @note *We do not use router*, instead we only use redux to avoid having
//     multiple source of thruth, as we've faced the same challenges
//     referenced in
//     `https://stackoverflow.com/questions/48893490/react-router-vs-redux-first-routing`
//     in a previous version of the source code. We use a framework similar
//     to the one mentioned in this article
//     `https://medium.freecodecamp.org/an-introduction-to-the-redux-first-routing-model-98926ebf53cb`,
//     although no the same one, as the one we use has a higher community
//     spread & is compatible with react-native such as it doesn't
//     necessarily rely on browser history, but can rely on mobile native
//     mechanism for backward/forward navigation instead. See
//     `https://github.com/respond-framework/rudy/blob/master/packages/rudy/docs/react-native.md`.
// @warning Rudy's documentation (the redux router) is partly out of date.
// @note EDIT: we do not use redux anymore either. Navigation system is
//     implemented manually.

// -- About theme and components
//
// @note We use native-base-theme library modified to use iOS style theme on
//         both android & ios. The native-base-theme's theme is located in the
//         `./crossplatform/theme` folder.

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

            // storeSurvey store the survey both remotely (through Aware) and
            // locally (for graphs).
            storeSurvey,

            // ...no need for storeRestingState as this is done in the java
            // side (cf. comments bellow at the RestingStateTask component).
        }) =>
        <>
            <AppLoader
                onUserNotYetRegistered={
                    async (isSoftwareUpdateAvailable) => {
                        // Track user bugs by user id.
                        BugReporter.setDeviceId('unregistered');

                        // Log current state.
                        console.info('user not yet registered.');

                        // Update the app if relevant.
                        if (isSoftwareUpdateAvailable) {
                            // Log new version is available.
                            console.info('a new software version is available.');

                            // Launch the software update view so user update the
                            // app.
                            goTo(SoftwareUpdate);
                        }
                        // If the app doesn't have any update...
                        else {
                            // Launch onboarding so the user can configure the
                            // app settings otherwise.
                            goTo(Onboarding);
                        }
                    }
                }
                onUserAlreadyRegistered={
                    async (isSoftwareUpdateAvailable, userSettings) => {
                        // Track user bugs by user id.
                        BugReporter.setDeviceId(userSettings.awareDeviceId);

                        // Log current state.
                        console.info(`
                            user retrieved with
                            studyModality=${userSettings.studyModality}
                            awareDeviceId=${userSettings.awareDeviceId}
                            awareStudyUrl=${userSettings.awareStudyUrl}
                            lastSubmittedSurveyTaskTimestamp=${userSettings.lastSubmittedSurveyTaskTimestamp}
                            lastSubmittedRestingStateTaskTimestamp=${userSettings.lastSubmittedRestingStateTaskTimestamp}.
                        `.replace(/ {4}/g, ''));

                        // Share the loaded user settings with the rest of the
                        // app.
                        setUserSettings(userSettings);

                        // Update the app if relevant.
                        if (isSoftwareUpdateAvailable) {
                            // Log new version is available.
                            console.info('a new software version is available.');

                            // Launch the software update view so user update the
                            // app.
                            goTo(SoftwareUpdate);
                        }
                        // If the app doesn't have any update...
                        else {
                            // Go to the home screen as app has been loaded.
                            goTo(Home);

                            // Start and setup aware background service.
                            // Probably unnecesseray, since aware should be kept
                            // launched independently from the app, restarted on
                            // crash, and even restarted automatically at phone
                            // boot. But for safety..
                            // Still, we first check aware study is not joined (
                            // although this method doesn't check if services
                            // are correctly started). Indeed, we've had issues
                            // with ANR at app launch, these calls would had been
                            // the cause.
                            if (await AwareManager.hasStudyBeenJoined() === false) {
                                BugReporter.breadcrumb('starting aware...', 'log');
                                await startAware(userSettings.awareDeviceId || 'byp0auth');
                                await joinAwareStudy(userSettings.awareStudyUrl);
                            }
                        }
                    }
                }
            />

            <SoftwareUpdate
                onUpdateBypass={
                    () => {
                        // ...allow user to bypass update through long presses.

                        // Log update has been bypassed.
                        BugReporter.notify('update: install bypassed');

                        // Go to home if user is already set up.
                        if (typeof userSettings !== 'undefined') {
                            goTo(Home)
                        }
                        // Go to onboarding otherwise.
                        else {
                            goTo(Onboarding);
                        }
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
                        onAuthSucceeded={
                            (studyModality, awareDeviceId, awareStudyUrl) => {
                                // Track user bugs by user id.
                                BugReporter.setDeviceId(awareDeviceId);

                                // Set study values temporarily so they can be
                                // used to start aware in DataCollection step
                                // and then stored locally in OnboardingEnd
                                // step.
                                setStudyModality(studyModality);
                                setAwareDeviceId(awareDeviceId);
                                setAwareStudyUrl(awareStudyUrl);

                                // Go to next onboarding step.
                                goToStep(CheckWifi);
                            }
                        }
                        onStartTest={
                            async (deviceId: string) => {
                                // Track user bugs by user id.
                                BugReporter.setDeviceId(deviceId);

                                // Bypass onboarding process, aware loading and
                                // go straightly to the Home component instead.
                                // Useful for integration testing scenari which
                                // don't need Aware. For instance, notification
                                // testing.

                                // We need to set the study modality in user
                                // settings. It is mandatory for Home component
                                // as Home needs to know which task to suggest
                                // to the user.
                                // We can use either 'setAndStoreUserSettings'
                                // or 'setUserSettings'. We use the latter
                                // because it prevents the next app launch to
                                // try to start up with fake aware settings (
                                // see <AppLoader>) and we don't need to be
                                // able to store app state across app reload
                                // for tests yet.
                                await setUserSettings({
                                    studyModality: 'daily',
                                    awareDeviceId: deviceId,
                                    awareStudyUrl: 'http://we-do-not-use/aware-study/because-testing-mode'
                                });

                                // Setup scheduled notification.
                                NotificationManager.schedule({ studyModality: 'daily' });

                                // Then we can go to the Home component.
                                goTo(Home);
                            }
                        }
                    />

                    <CheckWifi
                        onStepFinished={
                            () => {
                                // Go to next onboarding step.
                                goToStep(RequestPermissionsNotice);
                            }
                        }
                    />

                    <RequestPermissionsNotice
                        onStepFinished={
                            () => {
                                // Go to next onboarding step.
                                goToStep(RequestPermissions);
                            }
                        }
                    />

                    <RequestPermissions
                        onStepFinished={
                            () => {
                                // Go to next onboarding step.
                                goToStep(RequestBypassDozePrivilege);
                            }
                        }
                    />

                    <RequestBypassDozePrivilege
                        onStepFinished={
                            () => {
                                // Go to next onboarding step.
                                goToStep(RequestAccessibilityPrivilege);
                            }
                        }
                        onBypassRequest={
                            () => {
                                // Go to next onboarding step in case of bypass
                                // (could be useful if cellphone happens to be
                                // incompatible with the android feature due to
                                // non-standard android fork).
                                goToStep(RequestAccessibilityPrivilege);
                            }
                        }
                    />

                    <RequestAccessibilityPrivilege
                        onStepFinished={
                            () => {
                                // Go to next onboarding step.
                                goToStep(RequestsConfirmation);
                            }
                        }
                    />

                    <RequestsConfirmation
                        onStepFinished={
                            () => {
                                // Go to next onboarding step.
                                goToStep(DataCollection);
                            }
                        }
                    />

                    <DataCollection
                        onStartAwareClicked={
                            async () => {
                                // Start aware.
                                BugReporter.breadcrumb('starting aware...', 'log');
                                await startAware(awareDeviceId || 'byp0auth');

                                // Join study.
                                BugReporter.breadcrumb('joining aware study...', 'log');
                                await joinAwareStudy(awareStudyUrl);

                                // Log aware study has been joined, as app may
                                // be stuck at this point. Indeed, there is no
                                // proper error callback mechanism implemented
                                // in case of join study failure.
                                BugReporter.breadcrumb('aware study joined!', 'state', {
                                    studyUrl: awareStudyUrl
                                });
                                BugReporter.notify('aware study joined');
                            }
                        }
                        onStepFinished={
                            () => {
                                // Go to next onboarding step.
                                goToStep(SurveyTaskOnboarding);
                            }
                        }
                        onStartAwareBypassed={
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
                                const currentTimestamp = new Date().getTime();
                                storeSurvey(currentTimestamp, { fake: 0.1, fake2: 0.6, fake3: 0.4 });

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
                                storeSurvey(msTimestamp, values);

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
                        onTaskPostponed={
                            () => {
                                // Go back.
                                goToStep(RestingStateTaskOnboarding);
                            }
                        }
                        onMuseIncompatibility={
                            () => {
                                // Log muse incompatibility.
                                BugReporter.notify('Device is incompatible with Muse. Bypassing resting state task.');

                                // Toggle muse incompatibility alert.
                                Alert.alert('Device is incompatible with Muse. Bypassing task.');

                                // Redirect to next step.
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
                        onBypassTask={
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
                lastSubmittedSurveyTimestamp={userSettings && userSettings.lastSubmittedSurveyTaskTimestamp}
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
                        // Track app state for bug reporter.
                        BugReporter.breadcrumb('storing survey...', 'log', {
                            timestamp: msTimestamp,
                            length: Object.keys(values).length
                        });
                        BugReporter.notify('storing survey');

                        // Store survey to Aware for server sync and locally in
                        // realm for graphs
                        storeSurvey(msTimestamp, values);

                        // Store task timestamp so we don't allow user to do it
                        // again through Home screen.
                        await setAndStoreUserSettings({ lastSubmittedSurveyTaskTimestamp: msTimestamp });

                        // Switch to home screen as task is finished.
                        goTo(RestingStateTask);
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
                        // Track app state for bug reporter.
                        BugReporter.breadcrumb('storing resting state...', 'log', {
                            timestamp: msTimestamp
                        });
                        BugReporter.notify('storing resting state');

                        // ...resting state eeg data are already stored inside
                        // aware through java code (bound from RestingStateTask
                        // component's code). Can't be done any other way due
                        // to high frequency real time constraints of eeg
                        // recording.

                        // Store task timestamp so we don't allow user to do it
                        // again through Home screen.
                        await setAndStoreUserSettings({ lastSubmittedRestingStateTaskTimestamp: msTimestamp });

                        // Switch to home screen as task is finished.
                        goTo(Home);
                    }
                }
                onMuseIncompatibility={
                    () => {
                        // Log muse incompatibility.
                        BugReporter.notify('bypassing resting state task: device is incompatible with muse');

                        // Toggle muse incompatibility alert.
                        Alert.alert('Device is incompatible with Muse. Bypassing task.');

                        // Redirect to home.
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