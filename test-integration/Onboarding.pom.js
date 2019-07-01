import wd from 'wd';

// Every method of this class moves the device toward next onboarding steps.
// `await driver.setImplicitWaitTimeout(implicitWaitTimeout);` has to be set
// manually before starting using the methods.
class OnboardingPageObjectModel {

    constructor(driver, implicitWaitTimeout) {
        this.driver = driver;
        this.implicitWaitTimeout = implicitWaitTimeout;
    }

    // @note Used to not work with debug apk as it was failing due to
    //     react-native using dynamic javascript view in this mode which
    //     will make appium crash by changing android view's element
    //     position in dom! We now use accessibilityId & larger implicit
    //     timeout exclusively so this is no longer an issue.

    // @warning make sure all button have different accessibility id
    //     inbetween screens otherwise appium might not find out the
    //     button has changed as it doesn't detect screen transition.

    auth = async (deviceId, studyCode) => {
        const { driver, implicitWaitTimeout } = this;

        // deviceIdInput
        let deviceIdInput = await driver.elementByAccessibilityId('DeviceIdInput, ');
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

    checkWifi = async () => {
        const { driver, implicitWaitTimeout } = this;

        let nextButton = await driver.elementByAccessibilityId('CheckWifiNextButton, ');
        await nextButton.click();
    }

    grantPermissions = async () => {
        const { driver, implicitWaitTimeout } = this;
        
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

    startAware = async () => {
        const { driver, implicitWaitTimeout } = this;
        
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

    bypassSurveyTask = async () => {
        const { driver, implicitWaitTimeout } = this;
        
        // Survey Task - Long press on start task button to bypass it.
        let startTaskButton = await driver.elementByAccessibilityId('StartSurveyTaskButton, ');
        let action = new wd.TouchAction(driver);
        action
            .longPress({el: startTaskButton})
            .wait(10000) // 10 sec off the 7 s required (3 sec additional margin).
            .release();
        await action.perform();
    }

    bypassRestingStateTask = async () => {
        const { driver, implicitWaitTimeout } = this;
        
        // Survey Task - Long press on start task button to bypass it.
        let StartRestingStateTaskButton = await driver.elementByAccessibilityId('StartRestingStateTaskButton, ');
        let action = new wd.TouchAction(driver);
        action
            .longPress({el: StartRestingStateTaskButton})
            .wait(10000) // 10 sec off the 7 s required (3 sec additional margin).
            .release();
        await action.perform();
    }

    syncAwareData = async () => {
        const { driver, implicitWaitTimeout } = this;
        
        // Clear logs..
        await driver.log('logcat');

        // Start syncing data.
        let syncButton = await driver.elementByAccessibilityId('SyncButton, ');
        await syncButton.click();

        // Once data sync is finished (and thus nextButton is shown).
        try {
            // Allow two minutes for data sync to occurs
            await driver.setImplicitWaitTimeout(1000 * 60 * 2);
            await driver.elementByAccessibilityId('CheckDataSyncNextButton, ');
            await driver.setImplicitWaitTimeout(implicitWaitTimeout);
        }
        catch (e) {
            // Prevent exception from quitting the script. May be sync took more than 20secs ?
            console.error(e);
        }

        // Retrieve & clear logs.
        const logObjectArray = await driver.log('logcat');

        // Parse tested data from log.
        const generalLogRegex = /^[0-9-]+\s+[0-9:\.]+\s+[0-9]+\s+[0-9]+\s+(\w)\s+([\w:]+)\s*:\s+(.*)$/;
        const testLogRegex = /^~test (\w+): (\w+) ([0-9]+)\/([0-9]+) (\w+) (\w+)$/;
        let logs = logObjectArray
            // Map log object array into fromatted log string (w/ time data etc.) regex result.
            .map(l => l.message.match(generalLogRegex))
            // Remove logs that doesn't match the general log regex.
            .filter(l => l !== null)
            // Retrieve log string from regex result.
            .map(([, severity, shrinkedTag, log]) => log);

        let testData = logs
            // Map log message into formatted test log data.
            .map(l => l.match(testLogRegex))
            // Remove logs that doesn't match the test log regex.
            .filter(l => l !== null)
            // Generate test data from regex result.
            .map(([, table, status, lastRowUploaded, rowCount, serverSideRowCount, error]) => ({
                table,
                status,
                clientUploadedCount: +lastRowUploaded,
                clientUploadingCount: +rowCount,
                serverStoredCount: serverSideRowCount === 'null' ? null : +serverSideRowCount,
                error: error === 'undefined' ? undefined : error
            }));

        // Go to next step.
        let nextButton = await driver.elementByAccessibilityId('CheckDataSyncNextButton, ');
        await nextButton.click();

        return testData;
    }

    finishOnboarding = async () => {
        const { driver, implicitWaitTimeout } = this;

        let nextButton = await driver.elementByAccessibilityId('OnboardingEndNextButton, ');
        await nextButton.click();
    }
}

export default OnboardingPageObjectModel;