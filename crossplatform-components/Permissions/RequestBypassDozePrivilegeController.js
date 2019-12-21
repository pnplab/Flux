/**
 * @flow
 *
 * Checks if current package is not affected by Volte, Doze. This only
 * works for Android OS native battery savings, not custom ones (e.g., Sony
 * Stamina, etc). (cf. Aware source code).
 *
 * This is required to bypass android service limitations in order for
 * - the tracking to be able to start back at phone reboot.
 * - the tracking to occur when the phone is sleeping.
 */

import React, { PureComponent } from 'react';

import RequestBypassDozePrivilegeView from './RequestBypassDozePrivilegeView';
import AwareManager from '../../crossplatform-model/native-db/AwareManager';
import BugReporter from '../../crossplatform-model/native-db/BugReporter';

// Configure types.
type Props = {
    +onStepFinished: () => void,
    +onBypassRequest: () => void // in case of incompatibility.
};
type State = {
    +isBatteryOptimisationIgnored: ?boolean,
    +hasError: boolean
};

// Configure component logic.
export default class RequestBypassDozePrivilege extends PureComponent<Props, State> {

    // Set displayName for debug and bugreport navigation tracing.
    static displayName = 'RequestBypassDozePrivilege';

    constructor(props: Props) {
        super(props);

        this.state = {
            // @warning we have know way of knowing if the result is pending or
            // not except once privilege has been granted! Thus, due to
            // polling, we have no deterministic way to know if user refuse
            // request and to know if request has been triggered, only if he
            // accepts it. We could use a short non-deterministic mechanism
            // using timeout though (should be almost always reliable except
            // perhaps on huge lag).
            isBatteryOptimisationIgnored: undefined,
            hasError: false
        };
    }

    // Polling state interval id.
    _intervalId = null;

    async componentDidMount() {
        // Poll for privilege change and refresh the screen every second (only
        // on change). Indeed, we do not have a way to know when the privilege
        // has been granted.
        this._intervalId = setInterval(async () => {
            // Update state (if relevant).
            let privilegeHasBeenGranted = await this._updateState();

            // Stop polling once the request has been granted.
            let stopPolling = privilegeHasBeenGranted;
            if (stopPolling) {
                // Remove polling interval.
                clearInterval(this._intervalId);
                this._intervalId = null;
            }

            // Finish step.
            let finishStep = privilegeHasBeenGranted;
            if (finishStep) {
                this.props.onStepFinished();
            }
        }, 1000);
    }

    componentWillUnmount() {
        // Clear polling interval.
        if (this._intervalId !== null) {
            clearInterval(this._intervalId);
        }
    }

    // @returns true when privilege has been granted, but also mutate state.
    _updateState = async () => {
        // Check whether doze bypass privilege is granted or not.
        try {
            // Request setting status.
            let isBatteryOptimisationIgnored = await AwareManager.isBatteryOptimisationIgnored();

            // Update component state.
            this.setState({
                isBatteryOptimisationIgnored: isBatteryOptimisationIgnored,
                hasError: false
            });

            // Return setting status so polling can be stopped once activated.
            return isBatteryOptimisationIgnored;
        }
        // In case of issue.
        catch (e) {
            // Log error.
            console.error(e);
            BugReporter.notify(e);

            // Display error to the user. Ignore error if we find out
            // privilege was granted before (probably useless, just for
            // asynchronicity safety).
            this.setState(s => ({
                isBatteryOptimisationIgnored: s.isBatteryOptimisationIgnored ? true : undefined,
                hasError: s.isBatteryOptimisationIgnored ? false : true
            }));

            // Return setting status so polling can be stopped once activated.
            return false;
        }
    }

    // Request ignore battery optimisation permission. Triggers onStepFinished
    // once granted.
    // @warning This permission is not allowed to be requested for Google Play
    //     apps.
    ignoreBatteryOptimisation = async () => {
        // Ignore battery optimisations and allow services to start back at
        // phone reboot etc.
        try {
            await AwareManager.ignoreBatteryOptimisation();
        }
        catch(e) {
            // Log Error.
            console.error('failed to ignore battery optimisation. this is bad. might be phone incompatibility.');
            console.error(e);
            BugReporter.notify('failed to ignore battery optimisation. this is bad. might be phone incompatibility.');
            BugReporter.notify(e);

            // Display error to the user. Ignore error if previous state was
            // positive. Indeed, could potentially be rejection due to
            // duplicate request trigger (although unlikely, just extra safety,
            // android is highly decoupled so error will probably already be
            // ignored in native code anyway).
            this.setState(s => ({
                isBatteryOptimisationIgnored: s.isBatteryOptimisationIgnored ? true : undefined,
                hasError: s.isBatteryOptimisationIgnored ? false : true
            }));

            // Manual setting fallback is possible, request can be bypassed
            // with long press.
        }

    }

    // Allow user to bypass request with long press on button. A good fallback
    // if it happens a phone doesn't support the feature for some reason.
    bypassRequest = () => {
        this.props.onBypassRequest();
    }

    render() {
        return (
            <RequestBypassDozePrivilegeView
                onRequestPermission={this.ignoreBatteryOptimisation}
                onBypassRequest={this.bypassRequest}
                hasError={this.state.hasError}
            />
        );
    }

}
