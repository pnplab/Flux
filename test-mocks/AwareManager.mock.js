/**
 * @flow
 */

jest.mock('../crossplatform-model/native-db/AwareManager', () => {
    // Mock the default AwareManager export which is an instance of the class
    // AwareManager (thus not the class itself but an object!).
    return {
        requestPermissions: jest.fn(() => Promise.resolve()),
        startAware: jest.fn(),
        stopAware: jest.fn(),
        // getStudySensorList: jest.fn(),
        joinStudy: jest.fn(() => Promise.resolve()), // @todo setDeviceId
        // storeSurvey: jest.fn(),
        syncData: jest.fn(() => Promise.resolve()),
        listenSyncEvents: jest.fn(() => () => { /* unlisten function */ }),
        getDeviceId: jest.fn(() => Promise.resolve('TEST_DEVICE_ID')),
        // getSyncedDataCheckupForTable: jest.fn(() => Promise.resolve()),
        enableAutomaticSync: jest.fn(),
        disableAutomaticSync: jest.fn(),
        enableMandatoryWifiForSync: jest.fn(),
        disableMandatoryWifiForSync: jest.fn(),
        enableMandatoryBatteryForSync: jest.fn(),
        disableMandatoryBatteryForSync: jest.fn(),
    };
});
