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
            await this.props.onUserNotYetRegistered();
        }
        // User already setup, we can send relevant configuration data and
        // start the app.
        else {
            // Retrieve the user configuration data first.
            let userSettings = await UserManager.getUserSettings();
            
            // Send them to the rest of the app.
            await this.props.onUserAlreadyRegistered(userSettings);
        }
    }

    render() {
        return (
            <AppLoaderView></AppLoaderView>
        );
    }
}
 