import wd from 'wd';

const SERVER_PORT = 4723;
const SERVER_URL = 'localhost';

// @note doc http://appium.io/docs/en/writing-running-appium/caps/index.html
// No need to set up capabilities for device farm CI !
const CAPABILITIES = {
    // Auto accept dialogs
    autoGrantPermissions: true,

    // Disable newCommandTimeout so timeout doesn't occurs while we 
    // wait 15min for data to sync without triggering any command.
    newCommandTimeout: 0,

    automationName: 'UiAutomator2',

    // Make sure we reset the permissions
    fullReset: true, 
};

// Export new constructor for driver, with an overriden method init that
// setup the configured capabilities by default.
export default function() {
    let driver = wd.promiseChainRemote(SERVER_URL, SERVER_PORT);

    let prevInit = driver.init;

    driver.init = function(capabilities_) {
        if (typeof capabilities_ === 'undefined') {
            return prevInit.call(this, CAPABILITIES);
        }
        else {
            return prevInit.call(this, capabilities_);
        }
    };

    return driver;
}