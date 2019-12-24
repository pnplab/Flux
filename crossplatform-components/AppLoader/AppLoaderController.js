/*
 * @flow
 *
 * @description
 * Startup screen, showing the button to access the survey depending on the
 * time.
 */

import React, { PureComponent } from 'react';
import AppLoaderView from './AppLoaderView';
import UserManager from '../../crossplatform-model/persistent-db/UserManager';
import SoftwareUpdateManager from '../../crossplatform-model/native-db/SoftwareUpdateManager';

// Configure types.
type Props = {
    onUserNotYetRegistered: () => void,
    onUserAlreadyRegistered: (userSettings: {|
        +studyModality: 'daily' | 'weekly',
        +awareDeviceId: string,
        +awareStudyUrl: string,
        +lastSubmittedSurveyTaskTimestamp: number,
        +lastSubmittedRestingStateTaskTimestamp: number
    |}) => void
};
type State = {

};

// Configure component logic.
export default class AppLoaderController extends PureComponent<Props, State> {

    static defaultProps = {

    };

    constructor(props: Props) {
        super(props);

        this.state = {

        };
    }

    async componentDidMount() {
        // Retrieve current user.
        let isUserAlreadySetup = await UserManager.isUserAlreadySetup();

        // User not yet setup, we should redirect the user to the onboarding.
        if (!isUserAlreadySetup) {
            // Find out if a new update is available for unregistered users.
            let isSoftwareUpdateAvailable = await SoftwareUpdateManager.isSoftwareUpdateAvailable(undefined);
            let isUpdateOptional = await SoftwareUpdateManager.isSoftwareUpdateOptional(undefined);

            // Trigger the callback.
            await this.props.onUserNotYetRegistered(isSoftwareUpdateAvailable, isUpdateOptional);
        }
        // User already setup, we can send relevant configuration data and
        // start the app.
        else {
            // Retrieve the user configuration data first.
            let userSettings = await UserManager.getUserSettings();

            // Find out if a new update is available for the current user. The
            // ability to have user specific update is useful to apply bug
            // fixes targeted to specfic user devices for instance (or even
            // features, ie. for patients that require schedule-change).
            let isSoftwareUpdateAvailable = await SoftwareUpdateManager.isSoftwareUpdateAvailable(userSettings.awareDeviceId);
            let isUpdateOptional = await SoftwareUpdateManager.isSoftwareUpdateOptional(userSettings.awareDeviceId);

            // Send them to the rest of the app.
            await this.props.onUserAlreadyRegistered(isSoftwareUpdateAvailable, isUpdateOptional, userSettings);
        }
    }

    render() {
        return (
            <AppLoaderView></AppLoaderView>
        );
    }
}
