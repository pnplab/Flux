import wd from 'wd';
import execSync from 'child_process';
// const execSync = require('child_process').execSync;

const SERVER_PORT = 4723;
const SERVER_URL = 'localhost';

const getAdbDeviceId = () => execSync('adb devices | head -2 | tail -1 | awk \'{ print $1 }\'');

const generateCapabilities = (appPath, deviceName) => ({
    // @note doc http://appium.io/docs/en/writing-running-appium/caps/index.html
    
    platformName: 'Android',
    deviceName: typeof deviceName === 'undefined' ? 'Android Emulator' : deviceName,

    // Set app path for upload & installation, otherwise use `'bundleId':
    // 'org.pnplab.flux'` to prevent reinstall.
    app: appPath,
    appPackage: 'org.pnplab.flux',

    // Make sure we reset the permissions
    // fullReset: true,

    // Auto accept dialogs
    autoGrantPermissions: true,

    // Disable newCommandTimeout so timeout doesn't occurs while we 
    // wait 15min for data to sync without triggering any command.
    newCommandTimeout: 0,

    automationName: 'UiAutomator2',
});

// Export new constructor for driver, with an overriden method init that
// setup the configured capabilities by default.
export default function(appPath, useDevice) {
    // Use emulator by default.
    useDevice = typeof useDevice === 'undefined' ? false : true;
    const adbDeviceId = !useDevice ? getAdbDeviceId() : undefined;

    let driver = wd.promiseChainRemote(SERVER_URL, SERVER_PORT);

    let prevInit = driver.init;

    driver.init = function(capabilities_) {
        if (typeof capabilities_ === 'undefined') {
            if (useDevice) {
                return prevInit.call(this, generateCapabilities(appPath, adbDeviceId));
            }
            else {
                return prevInit.call(this, generateCapabilities(appPath));
            }
        }
        else {
            return prevInit.call(this, capabilities_);
        }
    };

    return driver;
}
