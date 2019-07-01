import wd from 'wd';

const SERVER_PORT = 4723;
const SERVER_URL = 'localhost';

const generateCapabilities = appPath => ({
    // @note doc http://appium.io/docs/en/writing-running-appium/caps/index.html
    
    platformName: 'Android',
    deviceName: 'Android Emulator',
    // deviceName: '5505a915',

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
export default function(appPath) {
    let driver = wd.promiseChainRemote(SERVER_URL, SERVER_PORT);

    let prevInit = driver.init;

    driver.init = function(capabilities_) {
        if (typeof capabilities_ === 'undefined') {
            return prevInit.call(this, generateCapabilities(appPath));
        }
        else {
            return prevInit.call(this, capabilities_);
        }
    };

    return driver;
}