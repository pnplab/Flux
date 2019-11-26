/**
 * @flow
 */

// import * as Sentry from '@sentry/react-native';
import { Client } from 'bugsnag-react-native';
import { DEV, SENTRY_DSN, BUGSNAG_API_KEY } from '../../config';

// import for native crash function -- used for test purpose only
// import { NativeModules } from 'react-native';
// const { RNSentry } = NativeModules;

// Sentry.init({
//     dsn: SENTRY_DSN,
//     logLevel: Sentry.Severity.Debug,
//     release: `Flux@#${CI_COMMIT_SHORT_SHA || 'local'}`
// });

// Sentry.setTags({
//     environment: !DEV ? 'production' : 'development'
// });

const bugsnag = new Client(BUGSNAG_API_KEY);

class BugReporter {
    constructor() {}

    setDeviceId = (deviceId: string) => {
        // Sentry.configureScope((scope) => {
        //     scope.setUser({
        //         id: deviceId
        //     });
        // });
        bugsnag.setUser(deviceId);
    };
    
    notify = (str: string) => {
        // Sentry capture message in front of bugsnag capture make the app crash !
        // Sentry.captureMessage(str);

        bugsnag.notify(new Error(str));
    };
    
    breadcrumb = (str: string, type: 'error' | 'log' | 'navigation' | 'process' | 'request' | 'state' | 'user' | 'manual', data?: { [key: string]: any }) => {
        // @note `type` is mandatorily set according to https://docs.bugsnag.com/platforms/react-native/react-native/customizing-error-reports/#adding-detailed-breadcrumbs

        // Check type.
        if (data && typeof data.type !== 'undefined') {
            throw new Error('data can\'t contain object key called type as it\'s used internaly by bugsnag');
        }

        // @note native client is activated according to `RNSentry.nativeClientAvailable`.
        // Sentry.addBreadcrumb({
        //     message: str,
        //     category: type,
        //     data: data
        // });
        bugsnag.leaveBreadcrumb(str, { ...data, type: type });
    };

    // Used to test the behavior of bug reporters.
    crashNative = () => {
        RNSentry.crash();
    }
}

export default new BugReporter();
