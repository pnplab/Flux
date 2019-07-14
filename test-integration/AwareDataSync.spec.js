// @warning When computer go to sleep, emulator can enter a weird state where
//      ssl connections to the server fail. The solution is to restart the
//      emulator.
// @warning This file connects to a moved built version of Flux, which means 
//      the test code can be out of sync with the tested code.

import OnboardingPOM from './Onboarding.pom';

// Set 60min timeout, as there is a very long waiting time set to sync data!
// @todo Now it's been optimize we could shorten this.
jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000*60*60;

// Configure test run.
const driver = ((isDeviceFarm) => {
    // AWS device farm test run.
    if (isDeviceFarm) {
        console.log('Setup tests in aws device farm.');
        const DeviceFarmDriver = require('./DeviceFarmDriver').default;
        return new DeviceFarmDriver();
    }
    // Local test run.
    else {
        const appPath = '/Users/medullosuprarenal/Documents/_eeg/pristine/build/release/app-universal-release.apk';
        console.log('Setup tests locally.');
        console.log(`path: ${appPath}`)
        const EmulatorDriver = require('./EmulatorDriver').default;
        
        // @todo use argv[1] w/ default instead of plain value for apk path
        return new EmulatorDriver(appPath);
    }
})(typeof process.env.DEVICEFARM_DEVICE_NAME !== 'undefined');

// Setup tests.
describe('Flux', () => {

    // Launch Appium driver & app.
    beforeAll(async () => {
        await driver.init();
    });

    // Quit Appium driver & app.
    afterAll(async () => {
        await driver.quit();
    });

    describe('Aware Data Synchronization', () => {

        // Retrieve a list of table to generate tests programmatically.
        let tables;
        if (typeof process.env.SYNCED_TABLES === 'undefined') {
            // Retrieve synced table array manually, replaced by sed 
            // from env during test packaging.
            tables = [ /* @SED_SYNCED_TABLES_FROM_ENV */ ];
        }
        else {
            // Retrieve synced table array from environment, mostly 
            // used for local test setup.
            const syncedTablesString = process.env.SYNCED_TABLES;
            tables = JSON.parse(syncedTablesString);
        }

        // Share info about synced data accross tests.
        let testData;

        // Run the app onboarding till data synchronization, and record the
        // log at that moment.
        beforeAll(async () => {

            // Seek elements for 20s if not found from start.
            const implicitWaitTimeout = 1000 * 20;
            await driver.setImplicitWaitTimeout(implicitWaitTimeout);
            const onboardingPOM = new OnboardingPOM(driver, implicitWaitTimeout);

            const deviceId = `qa${Math.random().toString(36).substring(2, 10)}`;
            const studyCode = '4wc2uw';

            console.info(`========= STUDY SETUP ==========`);
            console.info(`deviceId: ${deviceId}`);
            console.info(`studyCode: ${studyCode}`);
            console.info(`=========== TABLES =============`);
            console.info(tables);
            console.info(`================================`);

            await onboardingPOM.auth(deviceId, studyCode);
            await onboardingPOM.checkWifi();
            await onboardingPOM.grantPermissions();
            await onboardingPOM.startAware();
            await onboardingPOM.bypassSurveyTask();
            await onboardingPOM.bypassRestingStateTask();
            const testData_ = await onboardingPOM.syncAwareData();
            await onboardingPOM.finishOnboarding();

            // console.info(`=========== DATA =============`);
            // console.info(testData_);
            // console.info(`==============================`);

            // Scope the variable globally.
            testData = testData_;
        });

        test("All synced tables are tested", async () => {
            let untestedTables = testData.map(d => d.table).filter(table => tables.indexOf(table) === -1);

            console.info(`====== UNTESTED TABLES =======`);
            console.info(untestedTables);
            console.info(`==============================`);

            expect(untestedTables.length).toBe(0);
        });

        for (let i in tables) {
            let table = tables[i];

            describe(table, () => {

                test(`${table} has received a sync trigger`, async () => {
                    // Retrieve table data.
                    let tableData = testData.filter(data => data.table === table)[0];

                    expect(tableData).toBeDefined();
                });

                test(`${table} has been synced`, async () => {
                    // Retrieve table data.
                    let tableData = testData.filter(data => data.table === table)[0];
                    let { status, clientUploadedCount, clientUploadingCount, serverStoredCount, error } = tableData;

                    expect(status).toBe('SYNC_DONE');
                });

                test(`${table} has been fully uploaded`, async () => {
                    // Retrieve table data.
                    let tableData = testData.filter(data => data.table === table)[0];
                    let { status, clientUploadedCount, clientUploadingCount, serverStoredCount, error } = tableData;

                    expect(clientUploadedCount).toBe(clientUploadingCount);
                });

                test(`${table} has been uploaded with at least one value`, async () => {
                    // Retrieve table data.
                    let tableData = testData.filter(data => data.table === table)[0];
                    let { status, clientUploadedCount, clientUploadingCount, serverStoredCount, error } = tableData;

                    expect(clientUploadedCount).toBeGreaterThan(0);
                });

                test(`${table} has been stored and restrieved at least one value on the server`, async () => {
                    // Retrieve table data.
                    let tableData = testData.filter(data => data.table === table)[0];
                    let { status, clientUploadedCount, clientUploadingCount, serverStoredCount, error } = tableData;

                    expect(serverStoredCount).toBeGreaterThan(0);
                });

                if (typeof process.env.DEVICEFARM_DEVICE_NAME === 'undefined') {
                    // Check for >= instead of === because we might be in
                    // debug mode with aware already started before app
                    // launch. In such case, new random deviceId wasn't
                    // taken into account at Auth step and thus db may
                    // already have records before sync.
                    test(`${table} contains at least the same amount of data on the server than what was uploaded`, async () => {
                        // Retrieve table data.
                        let tableData = testData.filter(data => data.table === table)[0];
                        let { status, clientUploadedCount, clientUploadingCount, serverStoredCount, error } = tableData;

                        expect(serverStoredCount).toBeGreaterThanOrEqual(clientUploadedCount);
                    });
                }
                else {
                    test(`${table} contains exactly the same amount of data on the server than what was uploaded`, async () => {
                        // Retrieve table data.
                        let tableData = testData.filter(data => data.table === table)[0];
                        let { status, clientUploadedCount, clientUploadingCount, serverStoredCount, error } = tableData;

                        expect(serverStoredCount).toBe(clientUploadedCount);
                    });
                }

                test(`${table} has not received any error during upload & retrieval from server`, async () => {
                    // Retrieve table data.
                    let tableData = testData.filter(data => data.table === table)[0];
                    let { status, clientUploadedCount, clientUploadingCount, serverStoredCount, error } = tableData;

                    expect(error).toBeUndefined();
                });

            });
        }

    });
});
