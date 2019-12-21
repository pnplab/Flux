/**
 * @flow
 */

import React, { PureComponent } from 'react';

import RequestAccessibilityPrivilegeView from './RequestAccessibilityPrivilegeView';
import AwareManager from '../../crossplatform-model/native-db/AwareManager';
import BugReporter from '../../crossplatform-model/native-db/BugReporter';
import BackgroundTimer from 'react-native-background-timer';

// Configure types.
type Props = {
    +onStepFinished: () => void,
    +onBypassRequest: () => void // for easier qa testing.
};
type State = {
    +currentStep: 'usage' | 'screenshot1' | 'screenshot2' | 'screenshot3',
    +isAccessibilityPrivilegeGranted: ?boolean
};

// Configure component logic.
export default class RequestAccessibilityPrivilegeController extends PureComponent<Props, State> {

    // Set displayName for debug and bugreport navigation tracing.
    static displayName = 'RequestAccessibility';

    constructor(props: Props) {
        super(props);

        this.state = {
            currentStep: 'usage',
            isAccessibilityPrivilegeGranted: undefined
        };
    }

    // Polling state interval id.
    _intervalId = null;

    async componentDidMount() {
        // Poll for privilege change and refresh the screen every second (only
        // on change). Indeed, we do not have a way to know when the privilege
        // has been granted. BackgroundTimer was required in order to be able
        // to use AwareManager#displayFluxAppBack (trigger android activity
        // launch intent from services settings).
        this._intervalId = BackgroundTimer.setInterval(async () => {
            // Update state (if relevant).
            let privilegeHasBeenGranted = await this._updateState();

            // Stop polling once the request has been granted.
            let stopPolling = privilegeHasBeenGranted;
            if (stopPolling) {
                // Remove polling interval.
                BackgroundTimer.clearInterval(this._intervalId);
                this._intervalId = null;
            }

            // Finish step.
            let finishStep = privilegeHasBeenGranted;
            if (finishStep) {
                // ...if privelege has been granted, user is probably currently
                // still on the accessibility service setting page. Open back the
                // Open Flux back in the foreground.
                AwareManager.displayFluxAppBack();

                // Go to next step.
                this.props.onStepFinished();
            }
        }, 1000);
    }

    componentWillUnmount() {
        // Clear polling interval.
        if (this._intervalId !== null) {
            BackgroundTimer.clearInterval(this._intervalId);
        }
    }

    // @returns true when privilege has been granted, but also mutate state.
    _updateState = async () => {
        // Check whether doze bypass privilege is granted or not.
        try {
            // Request setting status.
            let isAccessibilityPrivilegeGranted = await AwareManager.isAccessibilityServiceEnabled();

            // Update component state.
            this.setState({
                isAccessibilityPrivilegeGranted: isAccessibilityPrivilegeGranted
            });

            // Return setting status so polling can be stopped once activated.
            return isAccessibilityPrivilegeGranted;
        }
        // In case of issue.
        catch (e) {
            // Log error.
            console.error(e);
            BugReporter.notify(e);

            // Return setting status so polling can be stopped once activated.
            return false;
        }
    }

    // Open accessibility service window. Indeed, there is no way to configure
    // this programmatically (at least without system privilege).
    openSystemAccessibilitySettings = () => {
        AwareManager.openSystemAccessibilitySettings();
    }

    // Allow user to bypass request with long press on button. A good fallback
    // to bypass manual setting on e2e QA.
    bypassRequest = () => {
        this.props.onBypassRequest();
    }

    onNextStep = () => {
        // Display next explanation screen.
        this.setState(s => {
            switch (s.currentStep) {
            case 'usage':
                return { currentStep: 'screenshot1' };
            case 'screenshot1':
                return { currentStep: 'screenshot2' };
            case 'screenshot2':
                return { currentStep: 'screenshot3' };
            }
        });
    }

    render() {
        return (
            <RequestAccessibilityPrivilegeView
                currentStep={this.state.currentStep}
                onNextStep={this.onNextStep}
                onBypassRequest={this.bypassRequest}
                onRequestPermission={this.openSystemAccessibilitySettings}
            />
        );
    }

}
