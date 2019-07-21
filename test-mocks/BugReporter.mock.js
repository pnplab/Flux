/**
 * @flow
 */

jest.mock('../crossplatform-model/native-db/BugReporter', () => {
    return {
        setDeviceId: jest.fn(),
        notify:  jest.fn(),
        breadcrumb: jest.fn(),
        crashNative: jest.fn(),
    };
});
