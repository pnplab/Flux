const path = require('path');
import wd from 'wd';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000*60*15; // 15min timeout, as there is a very long waiting time set to sync data! 

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

        // Seek elements for 20s if not found from start.
        await driver.setImplicitWaitTimeout(1000 * 20);

        const deviceId = `qa${Math.random().toString(36).substring(2, 10)}`;
        const studyCode = '4wc2uw';

        let el1 = await driver.elementByXPath("/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.ScrollView/android.view.ViewGroup/android.view.ViewGroup[1]/android.widget.EditText");
        await el1.click();
        await el1.sendKeys(deviceId);
        let el2 = await driver.elementByXPath("/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.ScrollView/android.view.ViewGroup/android.view.ViewGroup[2]/android.widget.EditText");
        await el2.click();
        await el2.sendKeys(studyCode);
        let el3 = await driver.elementByXPath("/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.ScrollView/android.view.ViewGroup/android.view.ViewGroup[3]/android.widget.TextView");
        await el3.click();
        await driver.sleep(500);
        let el4 = await driver.elementByXPath("/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.ScrollView/android.view.ViewGroup/android.view.ViewGroup/android.widget.TextView");
        await el4.click();
        await driver.sleep(500);
        let el5 = await driver.elementByXPath("/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.view.ViewGroup[8]/android.widget.TextView");
        await el5.click();
        await driver.sleep(500);
        let el6 = await driver.elementByXPath("/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.view.ViewGroup/android.widget.TextView");
        await el6.click();
        await driver.sleep(500);
        let el7 = await driver.elementByXPath("/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.view.ViewGroup/android.widget.TextView");
        await el7.click();

        // Required to wait a bit of time for some reason.. `await wd.TouchAction#perform` probably doesn't wait for lazy appearance of button, thus buggy!`
        await driver.sleep(5000);
        
        // Survey Task
        let surveyButton = await driver.elementByXPath("/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.view.ViewGroup/android.widget.TextView");
        // Long press
        let action = new wd.TouchAction(driver);
        action
            .longPress({el: surveyButton})
            .wait(10000) // 10 sec off the 7 s required (3 sec additional margin).
            .release();
        await action.perform();

        // Required to wait a bit of time for some reason.. `await wd.TouchAction#perform` probably doesn't wait for lazy appearance of button, thus buggy!`
        await driver.sleep(5000);

        // Resting State Task
        let restingStateButton = await driver.elementByXPath("/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.view.ViewGroup/android.widget.TextView");
        // Long press
        let action2 = new wd.TouchAction(driver);
        action2
            .longPress({el: restingStateButton})
            .wait(10000) // 10 sec off the 7 s required (3 sec additional margin).
            .release();
        await action2.perform();

        // Trigger sync 
        await driver.sleep(1000);
        let [ el8 ] = await driver.elementsByAccessibilityId("SyncButton");
        // let el8 = await driver.elementByXPath("/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.view.ViewGroup/android.widget.TextView");
        await el8.click();

        // Wait 10 min till data are uploaded.
        await driver.sleep(1000 * 60 * 10);

        // Start survey task
        // let el8 = await driver.elementByXPath("/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.view.ViewGroup/android.widget.TextView");
        // await el8.click();
        
        // // Finish survey task
        // // Wait for the list to be loaded.
        // driver.sleep(5000);
        // // Scroll a lot!
        // for (let i=0; i<20; ++i) {
        //     let scrollAction = new wd.TouchAction(driver);
        //     scrollAction
        //         // @note y starts from the top bar, thus we don't start from 0!
        //         .longPress({x: 50, y: 150})
        //         .moveTo({x: 50, y: 600})
        //         .release();
        //     await scrollAction.perform();
        // }

        // let el9 = await driver.elementByXPath("/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.ScrollView/android.view.ViewGroup/android.view.ViewGroup[8]/android.view.ViewGroup");
        // await el9.click();
        // // Resting state
        // let restingStateButton = await driver.elementByXPath("/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.view.ViewGroup/android.widget.TextView");
        // // Long press
        // let action = new wd.TouchAction(driver);
        // action.longPress({el: restingStateButton});
        // await action.perform();

        // // Sync data
        // let el10 = await driver.elementByXPath("/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.view.ViewGroup/android.widget.TextView");
        // await el10.click();

        // let el1 = await driver.elementByXPath("/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.ScrollView/android.view.ViewGroup/android.widget.EditText");
        // await el1.click();
        // await el1.sendKeys("4wc2uw");
        // let el2 = await driver.elementByXPath("/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.ScrollView/android.view.ViewGroup/android.view.ViewGroup");
        // await el2.click();

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

        const SERVER_PORT = 4723;
        const SERVER_URL = 'localhost';

        // @note doc http://appium.io/docs/en/writing-running-appium/caps/index.html
        // No need to set up capabilities for device farm CI !
        const CAPABILITIES = {
            // Auto accept dialogs
            autoGrantPermissions: true,

            // Set app path for upload & installation, otherwise use `'bundleId':
            // 'org.pnplab.flux'` to prevent reinstall.
            // app: path.resolve(process.env.DEVICEFARM_APP_PATH),

            // platformName: process.env.DEVICEFARM_DEVICE_PLATFORM_NAME,

            // deviceName: process.env.DEVICEFARM_DEVICE_NAME,
            // udid: process.env.DEVICEFARM_DEVICE_UDID,

            // androidScreenshotPath: process.env.DEVICEFARM_SCREENSHOT_PATH,

            // Disable newCommandTimeout so timeout doesn't occurs while we 
            // wait 15min for data to sync without triggering any command.
            newCommandTimeout: 0,

            automationName: 'UiAutomator2',

            // Make sure we reset the permissions
            fullReset: true, 

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
        // 
        // @warning does not work with debug apk as it will fail due to
        //     react-native using dynamic javascript view in this mode which
        //     will make appium crash by changing android view's element
        //     position in dom! Use release apk with graddle debuggable
        //     proporty on instead.
        const app_path = '/Users/medullosuprarenal/Documents/_eeg/pristine/build/release/app-universal-release.apk';

        const SERVER_PORT = 4723;
        const SERVER_URL = 'localhost';

        // @note doc http://appium.io/docs/en/writing-running-appium/caps/index.html
        const CAPABILITIES = {
            platformName: 'Android',
            deviceName: 'Android Emulator',
            // deviceName: '5505a915',

            // Set app path for upload & installation, otherwise use `'bundleId':
            // 'org.pnplab.flux'` to prevent reinstall.
            app: app_path,
            // appPackage: 'org.pnplab.flux',

            // Make sure we reset the permissions
            fullReset: true,

            // Auto accept dialogs
            autoGrantPermissions: true,

            // Disable newCommandTimeout so timeout doesn't occurs while we 
            // wait 15min for data to sync without triggering any command.
            newCommandTimeout: 0,

            automationName: 'UiAutomator2',

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
