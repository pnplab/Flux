// const wd = require('wd');

const path = require('path');
import wd from 'wd';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;

const { driver, capabilities } = generateSetup();

describe('SomeComponent', () => {
                      
    beforeAll(async () => {
        try {
            await driver.init(capabilities);
        } catch(err) {
            console.log(err);

            // Rethrow exception to ensure tests fail in ci.
            throw err;
        }
    });

    afterAll(async () => {
        try {
            await driver.quit();
        }
        catch(err) {
            console.error(err);

            // Rethrow exception to ensure tests fail in ci.
            throw err;
        }
    });
    
    test('renders some use case', async () => {
        // our test actions and expectations.
        // expect(await driver.hasElementByAccessibilityId('testview')).toBe(true);

        // Seek elements for 5s if not found from start.
        await driver.setImplicitWaitTimeout(5000);

        let el1 = await driver.elementByXPath("/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.ScrollView/android.view.ViewGroup/android.widget.EditText");
        await el1.click();
        await el1.sendKeys("4wc2uw");
        let el2 = await driver.elementByXPath("/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.ScrollView/android.view.ViewGroup/android.view.ViewGroup");
        await el2.click();

        // Do not start study yet has it depends on the current time!
        // let el3 = await driver.elementByXPath("/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.ScrollView/android.view.ViewGroup/android.view.ViewGroup[2]");
        // await el3.click();

        expect(true);
    });
});


function generateSetup() {
    // AWS device farm test run.
    if (typeof process.env.DEVICEFARM_DEVICE_NAME !== 'undefined') {
        console.log('Setup tests in aws device farm.');

        const app_path = '/Users/medullosuprarenal/Documents/_eeg/pristine/Flux/android/app/build/outputs/apk/release/app-x86-release.apk';

        const SERVER_PORT = 4723;
        const SERVER_URL = 'localhost';

        // @note doc http://appium.io/docs/en/writing-running-appium/caps/index.html
        // No need to set up capabilities for device farm CI !
        const CAPABILITIES = {
            // Auto accept dialogs
            autoGrantPermissions: true,

            // // Set app path for upload & installation, otherwise use `'bundleId':
            // // 'org.pnplab.flux'` to prevent reinstall.
            // app: path.resolve(process.env.DEVICEFARM_APP_PATH),

            // platformName: process.env.DEVICEFARM_DEVICE_PLATFORM_NAME,

            // // Make sure we reset the permissions
            // fullReset: true, 
            //         # 'deviceName': environ['DEVICEFARM_DEVICE_NAME'],
            //         # 'udid': environ['DEVICEFARM_DEVICE_UDID'],
            //         # 'automationName': 'XCUITest', # fixes "A new session could not be created. Details: Appium's IosDriver does not support Xcode version 10.1. Apple has deprecated UIAutomation. Use the "XCUITest" automationName capability instead."
            //         # # 'showXcodeLog': True,
            //         # # 'showIOSLog': True,
            //         # # 'xcodeOrgId': environ['FLUX_TEST_XCODEORGID'],
            //         # # 'xcodeSigningId': environ['FLUX_TEST_XCODESIGNINID'],
            //         # # fixes https://github.com/appium/appium/issues/9418
            //         # 'useNewWDA': True,
            //         # 'wdaLaunchTimeout': 240000,
            //         # 'wdaConnectionTimeout': 240000,
            //         # # 'autoAcceptAlerts': True
        };

        return {
            capabilities: CAPABILITIES,
            driver: wd.promiseChainRemote(SERVER_URL, SERVER_PORT)
        }
    }
    // Local test run.
    else {
        console.log('Setup tests locally.');

        // @todo use argv[1] w/ default
        // py:    app = path.abspath(argv[1])
        //        debug: /Users/medullosuprarenal/Documents/_eeg/pristine/Flux/android/app/build/outputs/apk/debug/app-universal-debug.apk
        const app_path = '/Users/medullosuprarenal/Documents/_eeg/pristine/Flux/android/app/build/outputs/apk/release/app-universal-release.apk';

        const SERVER_PORT = 4723;
        const SERVER_URL = 'localhost';

        // @note doc http://appium.io/docs/en/writing-running-appium/caps/index.html
        const CAPABILITIES = {
            platformName: 'Android',
            deviceName: 'Android Emulator',

            // Set app path for upload & installation, otherwise use `'bundleId':
            // 'org.pnplab.flux'` to prevent reinstall.
            app: app_path,

            // Make sure we reset the permissions
            fullReset: true,

            // Auto accept dialogs
            autoGrantPermissions: true,

            // ios @todo convert from python
            //
            //   'platformName': 'iOS',
            //   # 'platformVersion': '12.0.1',
            //   # 'deviceName': 'nuKs Phone', # @note type `instruments -s devices` or `xcrun simctl list` to gather available device list on your computer
            //   # 'udid': '8c7bbb8db239a29a402dfc6d79995b92347999ca',
            //   'deviceName': environ['FLUX_TEST_DEVICENAME'],
            //   'udid': environ['FLUX_TEST_DEVICEUDID'],
            //   'automationName': 'XCUITest', # fixes "A new session could not be created. Details: Appium's IosDriver does not support Xcode version 10.1. Apple has deprecated UIAutomation. Use the "XCUITest" automationName capability instead."
            //   # 'showXcodeLog': True,
            //   # 'showIOSLog': True,
            //   'xcodeOrgId': environ['FLUX_TEST_XCODEORGID'],
            //   'xcodeSigningId': environ['FLUX_TEST_XCODESIGNINID'],
            //   # fixes https://github.com/appium/appium/issues/9418
            //   'useNewWDA': True,
            //   'wdaLaunchTimeout': 240000,
            //   'wdaConnectionTimeout': 240000,
            //   'autoAcceptAlerts': False
        };

        return {
            capabilities: CAPABILITIES,
            driver: wd.promiseChainRemote(SERVER_URL, SERVER_PORT)
        }
    }}
