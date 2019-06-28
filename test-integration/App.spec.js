// @warning When computer go to sleep, emulator can enter a weird state where
//      ssl connections to the server fail. The solution is to restart the
//      emulator.
// @warning App.spec.js connect to the built version of Flux, moved to a
//      subdirectory, which means the test code can be out of sync with the 
//      tested code.

const path = require('path');
const fs = require('fs'); // To store screenshot
import wd from 'wd';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000*60*60; // 60min timeout, as there is a very long waiting time set to sync data! 

const { driver, capabilities } = generateSetup();

// // Register screenshot when error happens so we can see what happened.
// // Taken & adapted from https://github.com/smooth-code/jest-puppeteer/issues/131
// const takeScreenshot = async () => {
//     let b64Png = await driver.takeScreenshot();
//     let b64PngData = b64Png.replace(/^data:image\/png;base64,/, '');
// 
//     fs.writeFile("screenshot-error.png", b64PngData, 'base64', (err) => {
//         if (err) {
//             throw err;
//         }
//         else {
//             console.debug('file screenshot-error.png written');
//         }
//     });
// }
// 
// /**
//  * jasmine reporter does not support async.
//  * So we store the screenshot promise and wait for it before each test
//  */
// let screenshotPromise = Promise.resolve();
// beforeEach(() => screenshotPromise);
// afterAll(() => screenshotPromise);
// 
// /**
//  * Take a screenshot on Failed test.
//  * Jest standard reporters run in a separate process so they don't have
//  * access to the page instance. Using jasmine reporter allows us to
//  * have access to the test result, test name and page instance at the same time.
//  */
// jasmine.getEnv().addReporter({
//     specDone: async result => {
//         if (result.status === 'failed') {
//             screenshotPromise = screenshotPromise
//                 .catch()
//                 .then(() => takeScreenshot(result.fullName));
//         }
//     },
// });

describe('Flux', () => {

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
    
    test('Assess data synchronization', async () => {
        // our test actions and expectations.
        // expect(await driver.hasElementByAccessibilityId('testview')).toBe(true);
        try {
            // Seek elements for 20s if not found from start.
            const implicitWaitTimeout = 1000 * 20;
            await driver.setImplicitWaitTimeout(implicitWaitTimeout);

            // @warning make sure all button have different accessibility id
            //     inbetween screens otherwise appium might not find out the
            //     button has changed as it doesn't detect screen transition.


            /* Onboarding / Auth Screen */
            {
                const deviceId = `qa${Math.random().toString(36).substring(2, 10)}`;
                const studyCode = '4wc2uw';

                console.info(`========= STUDY SETUP ==========`);
                console.info(`deviceId: ${deviceId}`);
                console.info(`studyCode: ${studyCode}`);
                console.info(`================================`);

                // deviceIdInput
                let deviceIdInput = await driver.elementByAccessibilityId('DeviceIdInput, ');
                // await driver.elementByXPath("/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.ScrollView/android.view.ViewGroup/android.view.ViewGroup[1]/android.widget.EditText");
                await deviceIdInput.click();
                await deviceIdInput.sendKeys(deviceId);

                // studyPasswordInput
                let studyCodeInput = await driver.elementByAccessibilityId('StudyCodeInput, ');
                await studyCodeInput.click();
                await studyCodeInput.sendKeys(studyCode);

                // Next button
                let nextButton = await driver.elementByAccessibilityId('AuthNextButton, ');
                await nextButton.click();
            }

            /* Onboarding / Check Wifi Screen */
            { 
                // await driver.sleep(500);
                let nextButton = await driver.elementByAccessibilityId('CheckWifiNextButton, ');
                await nextButton.click();
            }

            /* Onboarding / Check Permissions Screen */
            {
                // If we're in dev mode, may be permissions have already been
                // accepted because the app was already installed. In this case,
                // fast forward the process.
                await driver.setImplicitWaitTimeout(1000);
                let havePermissionsAlreadyBeenAccepted = undefined;
                try {
                    await driver.elementByAccessibilityId('CheckPermissionsNextButton, ');
                    havePermissionsAlreadyBeenAccepted = true;
                }
                catch (e) {
                    havePermissionsAlreadyBeenAccepted = false;
                }
                await driver.setImplicitWaitTimeout(implicitWaitTimeout);

                // Request permissions first. Due to auto permission accept, this 
                // will trigger & validate all the permission at once unlike.
                // regular end-user workflow.
                if (!havePermissionsAlreadyBeenAccepted) {
                    try {
                        let checkPermissionsButton = await driver.elementByAccessibilityId('RequestPermissionsButton, ');
                        await checkPermissionsButton.click();
                    }
                    catch (e) {
                        // Ignore issue if request perm button is not found, it 
                        // likely means app had already the permission granted.
                    }
                }

                // Go to next step.
                let nextButton = await driver.elementByAccessibilityId('CheckPermissionsNextButton, ');
                await nextButton.click();
            }

            /* Onboarding / Check Phenotyping */
            { 
                let startAwareButton = await driver.elementByAccessibilityId('StartAwareButton, ');
                await startAwareButton.click();

                try {
                    let nextButton = await driver.elementByAccessibilityId('CheckPhenotypingNextButton, ');
                    await nextButton.click();
                }
                catch (e) {
                    console.error('Aware study has probably not been joined. Is server online ?');
                    throw e;
                }
            }

            /* Onboarding / Survey Task */
            {
                // Required to wait a bit of time for some reason.. `await wd.TouchAction#perform` probably doesn't wait for lazy appearance of button, thus buggy!`
                // await driver.sleep(5000);

                // @note Scroll is not working..
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

                // Survey Task - Long press on start task button to bypass it.
                let startTaskButton = await driver.elementByAccessibilityId('StartSurveyTaskButton, ');
                let action = new wd.TouchAction(driver);
                action
                    .longPress({el: startTaskButton})
                    .wait(10000) // 10 sec off the 7 s required (3 sec additional margin).
                    .release();
                await action.perform();
            }

            /* Onboarding / Resting State Task */
            {
                // Required to wait a bit of time for some reason.. `await wd.TouchAction#perform` probably doesn't wait for lazy appearance of button, thus buggy!`
                // await driver.sleep(5000);
                
                // Survey Task - Long press on start task button to bypass it.
                let StartRestingStateTaskButton = await driver.elementByAccessibilityId('StartRestingStateTaskButton, ');
                let action = new wd.TouchAction(driver);
                action
                    .longPress({el: StartRestingStateTaskButton})
                    .wait(10000) // 10 sec off the 7 s required (3 sec additional margin).
                    .release();
                await action.perform();
            }

            /* Onboarding / Check Data Sync */
            {
                // Retrieve list of table to check.
                let tables;
                if (typeof process.env.SYNCED_TABLES === 'undefined') {
                    // Retrieve synced table array manually, replaced by sed 
                    // from env during test packaging.
                    tables = [ /* @SED_SYNCED_TABLES_FROM_ENV */ ];
                }
                else {
                    // Retrieve synced table array from environment, mostly 
                    // used for local test setup.
                    console.debug('process.env.SYNCED_TABLES: ', process.env.SYNCED_TABLES);
                    const syncedTablesString = process.env.SYNCED_TABLES;
                    tables = JSON.parse(syncedTablesString);
                }
                console.info(`=========== TABLES =============`);
                console.info(tables);
                console.info(`================================`);

                let syncButton = await driver.elementByAccessibilityId('SyncButton, ');
                await syncButton.click();

                // @todo check content & expect it to be <xxx>...

                // Once data sync is finished (and thus nextButton is shown).
                try {
                    await driver.elementByAccessibilityId('CheckDataSyncNextButton, ');
                }
                catch (e) {
                    // Prevent exception from quitting the script. May be sync took more than 20secs ?
                    console.error(e);
                }

                // Look up for every table.
                let resultsByTables = {};
                for (let i=0; i < tables.length; ++i) {
                    let table = tables[i];

                    // Disable waiting time as synced table may not be available
                    // and thus slow down the test run (as it can happens for 
                    // every table).
                    await driver.setImplicitWaitTimeout(1000);

                    // Retrieve data.
                    let status, clientUploadedCount, clientUploadingCount, serverStoredCount, error;
                    {
                        let statusTextElement = await driver.elementByAccessibilityId(`${table}Status, `);
                        let statusText = await statusTextElement.text();
                        let [, status_] = statusText.match(/^[^:]+:\s*(.*)$/);
                        status = status_;
                        console.log(`${table}: status: `, status);
                    }

                    {
                        let clientUploadCountTextElement = await driver.elementByAccessibilityId(`${table}ClientUploadCount, `);
                        let clientUploadCountText = await clientUploadCountTextElement.text();
                        let [, clientUploadedCount_, clientUploadingCount_] = clientUploadCountText.match(/^[^:]+:\s*([0-9]+)\/([0-9]+)$/);
                        clientUploadedCount = +clientUploadedCount_;
                        clientUploadingCount = +clientUploadingCount_;
                        console.log(`${table}: clientUploadedCount/clientUploadingCount: ${clientUploadedCount}/${clientUploadingCount}`);
                    }

                    {
                        let serverStoredCountTextElement = await driver.elementByAccessibilityId(`${table}ServerStoredCount, `);
                        let serverStoredCountText = await serverStoredCountTextElement.text();
                        let [, serverStoredCount_] = serverStoredCountText.match(/^[^:]+:\s*(.*)$/);
                        serverStoredCount = +serverStoredCount_;
                        console.log(`${table}: serverStoredCount: ${serverStoredCount}`);
                    }

                    try {
                        let errorTextElement = await driver.elementByAccessibilityId(`${table}Error, `);
                        let errorText = await errorTextElement.text();
                        let [, error_] = errorText.match(/^[^:]+:\s*(.*)$/);
                        error = error_ || undefined;

                        // We do not check for error because it can just be a
                        // reconnection attempt & SYNC_DONE check is enough.
                        // SERVER_CONNECTION_INTERRUPTED is ignored because
                        // it's looped upon until all rows are uploaded.
                        // expect(error).toBe('SERVER_CONNECTION_INTERRUPTED');
                    }
                    catch (e) {
                        /* ignore: element not found. */
                    }

                    // Set back implicit waiting back.
                    await driver.setImplicitWaitTimeout(implicitWaitTimeout);

                    // Store results in object so we can log all tables before
                    // throwing at first error and stopping the tests.
                    resultsByTables = {
                        ...resultsByTables,
                        [table]: {
                            status,
                            clientUploadedCount,
                            clientUploadingCount,
                            serverStoredCount,
                            error
                        }
                    };

                    // Log each table results.
                    console.info(`========= TABLE: ${table} ==========`);
                    console.info(`status: ${status}`);
                    console.info(`clientUploadedCount: ${clientUploadedCount}`);
                    console.info(`clientUploadingCount: ${clientUploadingCount}`);
                    console.info(`serverStoredCount: ${serverStoredCount}`);
                    console.info(`error: ${error}`);
                    console.info(``);
                }

                // Assess each table result.
                for (let table in resultsByTables) {
                    let { status, clientUploadedCount, clientUploadingCount, serverStoredCount, error } = resultsByTables[table];

                    expect(status).toBe('SYNC_DONE');
                    expect(clientUploadedCount).toBe(clientUploadingCount);
                    expect(clientUploadedCount).toBeGreaterThan(0);
                    expect(serverStoredCount).toBeGreaterThan(0);
                    if (typeof process.env.DEVICEFARM_DEVICE_NAME === 'undefined') {
                        // Check for >= instead of === because we might be in
                        // debug mode with aware already started before app
                        // launch. In such case, new random deviceId wasn't
                        // taken into account at Auth step and thus db may
                        // already have records before sync.
                        expect(serverStoredCount).toBeGreaterThanOrEqual(clientUploadedCount);
                    }
                    else {
                        expect(serverStoredCount).toBe(clientUploadedCount);
                    }
                    expect(error).toBe(undefined);
                }

                // Go to next step.
                let nextButton = await driver.elementByAccessibilityId('CheckDataSyncNextButton, ');
                await nextButton.click();
            }

            /* Onboarding / End Onboarding */
            {
                let nextButton = await driver.elementByAccessibilityId('OnboardingEndNextButton, ');
                await nextButton.click();
            }

            // Wait 15s so we have time to see the last screen and know it's
            // not a crash.
            await driver.sleep(1000 * 15);
        }
        catch (e) {
            // wait 1m before crashing so we can see where the issue has happened. 
            await driver.sleep(1000 * 60);
            throw e;
        }
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

        console.log('Setup tests locally.', app_path);

        // @note doc http://appium.io/docs/en/writing-running-appium/caps/index.html
        const CAPABILITIES = {
            platformName: 'Android',
            deviceName: 'Android Emulator',
            // deviceName: '5505a915',

            // Set app path for upload & installation, otherwise use `'bundleId':
            // 'org.pnplab.flux'` to prevent reinstall.
            app: app_path,
            appPackage: 'org.pnplab.flux',

            // Make sure we reset the permissions
            // fullReset: true,

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
