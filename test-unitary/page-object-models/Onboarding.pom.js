/**
 * @flow
 */

import { render } from 'react-native-testing-library';
import type { Element } from 'react';

import type Onboarding from '../../crossplatform-components/Onboarding/OnboardingController';
import * as pom from './index.js';

type RenderAPI = $Call<typeof render, Element<Onboarding>>;

class OnboardingPageObjectModel {
    renderedObject: RenderAPI;

    constructor(renderedObject: RenderAPI) {
        this.renderedObject = renderedObject;
    }

    // Returns true if the component is currently displayed on screen.
    isDisplayed = (): boolean => {
        // Retrieve root view component.
        const { queryByA11yLabel } = this.renderedObject;
        let rootViewComponent = queryByA11yLabel('onboarding');

        // Return whether root view has been found or not.
        return rootViewComponent !== null;
    }

    auth = async (deviceId: string, password: string): Promise<pom.CheckWifi | pom.Home | pom.Auth> => {
        // Get current view's page object model.
        let auth = new pom.Auth(this.renderedObject);
        
        // Ensure we are at the correct step before running the method further.
        expect(auth.isDisplayed()).toBeTruthy();

        // Authentificate the user.
        auth.typeDeviceId(deviceId);
        auth.typePassword(password);
        auth.pressSubmit();

        // Wait till user settings have been stored (required if the typed
        // password is not a test-scenario password that can bypasses this
        // step).
        await auth.untilAuthentificationHasBeenDone();

        // Ensure we've correctly moved toward the next step.
        switch (password) {
        case '371olh': {
            // When the entered password is a test-scenario password, then
            // the onboarding should be bypassed and the user should be
            // redirected to <Home> componenet.
            let home = new pom.Home(this.renderedObject);
            expect(home.isDisplayed()).toBeTruthy();

            // Return next step's page object model.
            return home;
        }
        case '4wc2uw':
        case 'f32bts': {
            // When the entered password is a study password, then the next
            // onboarding step should be loaded.
            let checkWifi = new pom.CheckWifi(this.renderedObject);
            expect(checkWifi.isDisplayed()).toBeTruthy();

            // Return next step's page object model.
            return checkWifi;
        }
        default: {
            // When it's another password, then the authentification should
            // fail and as such the authentification component should still be
            // displayed.
            expect(auth.isDisplayed()).toBeTruthy();

            // Return next step's page object model.
            return auth;
        }
        }
    }

    checkWifi = async (): Promise<pom.CheckPermissions> => {
        // Get current view's page object model.
        let checkWifi = new pom.CheckWifi(this.renderedObject);

        // Ensure we are at the correct step before running the method further.
        expect(checkWifi.isDisplayed()).toBeTruthy();

        // ...wait for initial wifi settings to be loaded.
        await checkWifi.untilNextButtonAppears();

        // Go to the next step.
        if (checkWifi.isWifiEnabled()) {
            checkWifi.pressNextButton();
        }
        else {
            throw new Error('not implemented as wifi should always be on due to mock.');
        }

        // Ensure we've correctly moved toward the next step.
        let checkPermissions = new pom.CheckPermissions(this.renderedObject);
        expect(checkPermissions.isDisplayed()).toBeTruthy();

        // Return next step's page object model.
        return checkPermissions;
    }

    checkPermissions = async (): Promise<pom.CheckPhenotyping> => {
        // Get current view's page object model.
        let checkPermissions = new pom.CheckPermissions(this.renderedObject);

        // Ensure we are at the correct step before running the method further.
        expect(checkPermissions.isDisplayed()).toBeTruthy();

        // ...wait for android permission status to have been loaded, given
        // permissions are already granted (this is mocked as such in our
        // PermissionsAndroid jest mock).
        await checkPermissions.untilNextButtonAppears();

        // Go to the next step.
        checkPermissions.pressNextButton();

        // Ensure we've correctly moved toward the next step.
        let checkPhenotyping = new pom.CheckPhenotyping(this.renderedObject);
        expect(checkPhenotyping.isDisplayed()).toBeTruthy();

        // Return next step's page object model.
        return checkPhenotyping;
    }

    checkPhenotyping = async (): Promise<pom.OnboardingSurveyTask> => {
        // Get current view's page object model.
        let checkPhenotyping = new pom.CheckPhenotyping(this.renderedObject);

        // Ensure we are at the correct step before running the method further.
        expect(checkPhenotyping.isDisplayed()).toBeTruthy();

        // Starts aware (which is mocked, thus do it doesn't start it!).
        checkPhenotyping.pressStartAwareButton();

        // ...wait for aware to load.
        await checkPhenotyping.untilNextButtonAppears();

        // Go to the next step.
        checkPhenotyping.pressNextButton();

        // Ensure we've correctly moved toward the next step.
        let onboardingSurveyTask = new pom.OnboardingSurveyTask(this.renderedObject);
        expect(onboardingSurveyTask.isDisplayed()).toBeTruthy();

        // Return next step's page object model.
        return onboardingSurveyTask;
    }

    bypassSurveyTask = async (): Promise<pom.OnboardingRestingStateTask> => {
        // Get current view's page object model.
        let onboardingSurveyTask = new pom.OnboardingSurveyTask(this.renderedObject);

        // Ensure we are at the correct step before running the method further.
        expect(onboardingSurveyTask.isDisplayed()).toBeTruthy();

        // Bypass survey task.
        onboardingSurveyTask.longPressStartTaskButton();

        // Ensure we've correctly moved toward the next step.
        let onboardingRestingStateTask = new pom.OnboardingRestingStateTask(this.renderedObject);
        expect(onboardingRestingStateTask.isDisplayed()).toBeTruthy();

        // Return next step's page object model.
        return onboardingRestingStateTask;
    }

    bypassRestingStateTask = async (): Promise<pom.CheckDataSync> => {
        // Get current view's page object model.
        let onboardingRestingStateTask = new pom.OnboardingRestingStateTask(this.renderedObject);

        // Ensure we are at the correct step before running the method further.
        expect(onboardingRestingStateTask.isDisplayed()).toBeTruthy();

        // Bypass resting state task.
        onboardingRestingStateTask.longPressStartTaskButton();

        // Ensure we've correctly moved toward the next step.
        let checkDataSync = new pom.CheckDataSync(this.renderedObject);
        expect(checkDataSync.isDisplayed()).toBeTruthy();

        // Return next step's page object model.
        return checkDataSync;
    }

    bypassCheckDataSync = async (): Promise<pom.OnboardingEnd> => {
        // Get current view's page object model.
        let checkDataSync = new pom.CheckDataSync(this.renderedObject);

        // Ensure we are at the correct step before running the method further.
        expect(checkDataSync.isDisplayed()).toBeTruthy();

        // Bypass data sync assessment step.
        checkDataSync.longPressSyncButton();

        // Ensure we've correctly moved toward the next step.
        let onboardingEnd = new pom.OnboardingEnd(this.renderedObject);
        expect(onboardingEnd.isDisplayed()).toBeTruthy();

        // Return next step's page object model.
        return onboardingEnd;
    }

    finish = async (): Promise<void> => {
        // Get current view's page object model.
        let onboardingEnd = new pom.OnboardingEnd(this.renderedObject);

        // Ensure we are at the correct step before running the method further.
        expect(onboardingEnd.isDisplayed()).toBeTruthy();

        // Go to the next step.
        onboardingEnd.pressNextButton();

        // ...await for <OnboardingEnd> async callback properties to finish
        // their processing.
        await onboardingEnd.untilUserHasBeenRegistered();

        // Ensure we've correctly moved toward the next step.
        let home = new pom.Home(this.renderedObject);
        expect(home.isDisplayed()).toBeTruthy();

        // Return next step's page object model.
        return home;
    }
}

export default OnboardingPageObjectModel;