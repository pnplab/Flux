const Koa = require('koa');
const koaHelmet = require('koa-helmet');
const koaBody = require('koa-body');
const koaProtect = require('koa-protect').koa;
const Router = require('koa-router');

const app = module.exports = new Koa();
const router = new Router();

// Upgrade channels.
const AVAILABLE_RELEASE_CHANNELS = [
    // Fastest release.
    'development',
    // Inside-lab testing.
    'testing',
    // In-production app update for subjects/patients.
    'production'
];

// Latest android versions code and apk file url...
// Development variables are automatically retrieved from latest github
// release's version.json file which is generated by gitlab CI.
const LATEST_DEVELOPMENT_ANDROID_VERSION_NAME = undefined;
const LATEST_DEVELOPMENT_ANDROID_VERSION_CODE = undefined;
const LATEST_DEVELOPMENT_ANDROID_APK_URL = undefined;

// The testing and production are set manually in this source file. The reason
// for this is setting this from the build system is possible but requires more
// work. Indeed, we can't just update the version.json format for this since
// these are 'stuck' in time (once released we shouldn't modify them) and we
// can't use pre-release github publishment (see app source code
// release.config.js comments for more informations).
// Android version name is actually false but we keep it for logging purpose
// to see which user bypasses the upgrade or not, download crashes, etc. As now
// it is set to something like git branch + commit from build trigger instead of
// git tag from release but changing this is a lot of work).
const LATEST_TESTING_ANDROID_VERSION_NAME = '1.6.1';
const LATEST_TESTING_ANDROID_VERSION_CODE = 104382336;
const LATEST_TESTING_ANDROID_APK_URL = 'https://github.com/pnplab/Flux/releases/download/v1.6.1/Flux.apk';
const LATEST_PRODUCTION_ANDROID_VERSION_NAME = '1.6.1';
const LATEST_PRODUCTION_ANDROID_VERSION_CODE = 104382336;
const LATEST_PRODUCTION_ANDROID_APK_URL = 'https://github.com/pnplab/Flux/releases/download/v1.6.1/Flux.apk';

// Provide install link information for latest version. This is used by the
// official release website.
router.get('/software-update-service/get-latest-version-for/android/production', async (ctx, next) => {
    ctx.body = {
        androidVersionCode: LATEST_PRODUCTION_ANDROID_VERSION_CODE,
        androidApkUrl: LATEST_PRODUCTION_ANDROID_APK_URL
    };

    // Tell koa the request can be processed.
    await next();
});

// Provide upgrade information based on current context. This is used by the
// app auto update mechanism.
router.get('/software-update-service/get-latest-version-for/android/:releaseChannel/:baseAndroidVersionCode/:targetDeviceId?', async (ctx, next) => {
    // Retrieve params.
    const params = ctx.params;

    // Verify release channel and return error if the value is unexpected.
    const releaseChannel = params.releaseChannel;
    if (AVAILABLE_RELEASE_CHANNELS.includes(releaseChannel)) {
        console.log('software-upgrade-service - release channel:', releaseChannel);
    }
    else {
        console.error('software-upgrade-service: bad release channel: ', releaseChannel);
        ctx.body = {
            error: 'bad release channel'
        };
        ctx.status = 400;
        return;
    }

    // Verify the base android version code and return error if the value is not a number.
    const baseAndroidVersionCodeStr = params.baseAndroidVersionCode;
    if (/^[0-9]+$/.test(baseAndroidVersionCodeStr)) {
        console.log('software-upgrade-service - base android version code:', baseAndroidVersionCodeStr);
    }
    else {
        console.error('software-upgrade-service bad android version code: ', baseAndroidVersionCodeStr);
        ctx.body = {
            error: 'bad base android version code'
        };
        ctx.status = 400;
        return;
    }

    // Use android version code as a number.
    const baseAndroidVersionCode = +baseAndroidVersionCodeStr;

    // Verify target targetDeviceId. It can be undefined for instance when
    // the user has not yet passed through the onboarding.
    const targetDeviceId = params.targetDeviceId;
    if (typeof targetDeviceId === 'undefined' || /^[_a-zA-Z0-9]{3,}$/.test(targetDeviceId)) {
        console.log('software-upgrade-service - target device id:', targetDeviceId);
    }
    else {
        console.error('software-upgrade-service - bad target device id format: ', targetDeviceId);
        ctx.body = {
            error: 'bad device id format'
        };
        ctx.status = 400;
        return;
    }

    // Setup upgrade policy, from most specificity to lowest...
    let targetAndroidVersionName;
    let targetAndroidVersionCode;
    let targetAndroidApkUrl;
    let isUpdateOptional;

    // Setup upgrade version based on the user's device id.
    switch (targetDeviceId) {
    case 'noupgrade':
        // Do not upgrade for the device id set as 'noupgrade'. This is
        // actually only used to test this feature. The target device id chunk
        // of code will likely be useful at some point when we'll want specific
        // upgrade.
        break;
    default:
        // ...do not use target device to decide what version to update to.
        break;
    }

    // Setup upgrade version based on current user's apk android version code.
    switch (baseAndroidVersionCode) {
    default:
        // ...do not use target device to decide what version to update to.
        break;
    }

    // Setup upgrade version based on the user's release channel.
    switch (releaseChannel) {
    case 'development':
    {
        // Always set as an optional upgrade, as developers will thus have the
        // choice to keep testing some feature on their current version.
        isUpdateOptional = true;

        // Retrieve latest version development channel. The development channel
        // is always the latest version.
        let releaseJson;
        try {
            // Retrieve latest release version from github. @note
            // eslint-disable-line used to disable fetch undefined error,
            // as node doesn't have fetch although react-native has, cf.
            // https://facebook.github.io/react-native/docs/network.

            // Retrieve latest release version.json file url.
            let githubLatestReleaseResp = await fetch('https://api.github.com/repos/pnplab/Flux/releases/latest'); // eslint-disable-line
            let githubLatestRelease = await githubLatestReleaseResp.json();
            let updaterVersionPackageUrl = githubLatestRelease
                .assets
                .filter(a => a.name === 'version.json')[0]
                .browser_download_url;

            // Retrieve latest version.json content.
            let releaseJsonResp = await fetch(updaterVersionPackageUrl); // eslint-disable-line
            releaseJson = await releaseJsonResp.json();
        }
        // If request failed, do not update. Probably due to internet not
        // being connected. Emulator happens to have DNS issue from time to
        // time, cold rebooting it work. The issue may be tested by opening
        // android's chrome and checking wikipedia for instance. This should
        // work!
        catch (e) {
            console.error('Github version file could\'nt be retrieved.');
            return;
        }

        console.log('release package info: ', releaseJson);

        const { versionName, versionCode, apkUrl } = releaseJson;

        // Check json file formatting.
        if (typeof versionCode !== 'number') {
            throw new Error('version.json\'s versionCode should be a number.');
        }
        if (typeof versionName !== 'string') {
            throw new Error('version.json\'s versionName should be a string.');
        }
        if (typeof apkUrl !== 'string') {
            throw new Error('version.json\'s apkUrl should be a boolean.');
        }

        // Set latest development channel android version code and url as the
        // latest git release.
        let latestAndroidVersionName = versionName;
        let latestDevelopmentAndroidVersionCode = versionCode;
        let latestDevelopmentAndroidApkUrl = apkUrl;

        targetAndroidVersionName = latestAndroidVersionName;
        targetAndroidVersionCode = latestDevelopmentAndroidVersionCode;
        targetAndroidApkUrl = latestDevelopmentAndroidApkUrl;

        break;
    }
    case 'testing':
    {
        // Always set as an optional upgrade, as testers will thus have the
        // choice to keep testing some feature on their current version.
        isUpdateOptional = true;

        // Retrieve latest apk and version for testing channel. It is hard
        // encoded this source file.
        targetAndroidVersionName = LATEST_TESTING_ANDROID_VERSION_NAME;
        targetAndroidVersionCode = LATEST_TESTING_ANDROID_VERSION_CODE;
        targetAndroidApkUrl = LATEST_TESTING_ANDROID_APK_URL;

        break;
    }
    case 'production':
    {
        // Always set as an optional upgrade, as we'll set otherwise mandatory
        // update through device-targeted upgrades, in case of critical fixes
        // for instance.
        isUpdateOptional = true;

        // Retrieve latest apk and version for production channel. It is
        // hard-code in this source file.
        targetAndroidVersionName = LATEST_PRODUCTION_ANDROID_VERSION_NAME;
        targetAndroidVersionCode = LATEST_PRODUCTION_ANDROID_VERSION_CODE;
        targetAndroidApkUrl = LATEST_PRODUCTION_ANDROID_APK_URL;

        break;
    }
    default:
        // ...should not happen as we've already checked for releaseChannel
        // value.
        throw new Error('unexpected release channel');
    }

    // Return result.
    // ...it's likely baseAndroidVersionCode === targetAndroidVersionCode. This
    // is tested in the app before comparing.
    ctx.body = {
        androidVersionName: targetAndroidVersionName,
        androidVersionCode: targetAndroidVersionCode,
        androidApkUrl: targetAndroidApkUrl,
        isUpdateOptional: isUpdateOptional
    };

    // Tell koa the request can be processed.
    await next();
});

app
    .use(koaHelmet())
    .use(koaBody({
        jsonLimit: '1kb'
    }))
    .use(koaProtect.sqlInjection({
        body: true,
        loggerFunction: console.error
    }))
    .use(koaProtect.xss({
        body: true,
        loggerFunction: console.error
    }))
    .use(router.routes())
    .use(router.allowedMethods());

if (!module.parent) {
    console.log('Starting koa node server!');
    app.listen(7983);
}
