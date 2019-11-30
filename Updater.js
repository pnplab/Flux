/**
 * @flow
 *
 * Originally deprecated package according to https://github.com/parryworld/react-native-appupdate.
 * Official page recommand to switch to https://github.com/odemolliens/react-native-app-update.
 * However, the latter doesn't handle app apk download etc. It seems to merely
 * be a wrapper that release diff versions in AppStore/Google Play.
 *
 * We randomly found mikehardy up-to-date fork here https://github.com/mikehardy/react-native-update-apk.
 *
 * @note
 * There is now an official way to go, compatible with app store:
 * https://developer.android.com/guide/app-bundle/in-app-updates
 * Although perhaps not compatible with internal play distribution pipeline or
 * not suitable for development upgrade (to be tested).
 *
 * If the user has not enabled unknown app sources, they may need to do so, and
 * you can advise them and send them directly to the system GUI pre-loaded with
 * your package:
 * https://developer.android.com/reference/android/provider/Settings.html#ACTION_MANAGE_UNKNOWN_APP_SOURCES
 * cf. react-native-update-apk's TODO.md
 * Android Q might require some changes.
 *
 * @note https://github.com/javiersantos/AppUpdater seems more powerful but
 *     also lacks flexible tag management (req. v?X.X.X.X) for github for
 *     instance.
 */
import * as UpdateAPK from 'rn-update-apk';
import { Alert } from 'react-native';

export async function triggerUpdateIfNeeded() {
    // @todo @warning only enable on wifi!

    // Fetch the updater version package of the last github release.
    // @todo change to a notification system instead.

    // Retrieve latest release version from github.
    // @note disable fetch undefined error, has node doesn't have fetch but
    //     react-native has, cf. https://facebook.github.io/react-native/docs/network.
    let updaterVersionPackage;
    try {
        let releaseJsonResp = await fetch('https://api.github.com/repos/pnplab/Flux/releases/latest'); // eslint-disable-line
        let releaseJson = await releaseJsonResp.json();
        updaterVersionPackage = releaseJson
            .assets
            .filter(a => a.name === 'version.json')[0]
            .browser_download_url;
    }
    // If request failed, do not update. Probably due to internet not being
    // connected. Emulator happens to have DNS issue from time to time, cold
    // rebooting it work. The issue may be tested by opening android's chrome
    // and checking wikipedia for instance. This should work!
    catch (e) {
        console.warn('Application auto update failed. Github version could\'nt be retrieved. The device is probably not currently connected to internet. On emulator, cold boot work.');
        console.warn(e);
        return;
    }

    // @todo switch to versionCode!

    console.info(updaterVersionPackage);

    // Generate updater.
    const updater = new UpdateAPK.UpdateAPK({
        // @note Must map android file provider defined in our AndroidManifest
        //     xml file.
        fileProviderAuthority: 'org.pnplab.flux.provider.storage',
        // iosAppId: '123456',
        apkVersionUrl: updaterVersionPackage,
        needUpdateApp: (needUpdate) => {
            // Trigger the update without asking the user !
            needUpdate(true);
        },
        forceUpdateApp: () => {
            // Forced update, found from the version.json
            console.log('Force update will start');
            Alert.alert('Force update will start');
        },
        notNeedUpdateApp: () => {
            console.log('App is up to date');
            Alert.alert('App is up to date');
        },
        downloadApkStart: () => {
            console.log('Start');
            Alert.alert('Start');
        },
        downloadApkProgress: (progress) => {
            console.log(`Downloading ${progress}%...`);
        },
        downloadApkEnd: () => {
            console.log('End');
            Alert.alert('End');
        },
        onError: () => {
            console.log('downloadApkError');
            Alert.alert('downloadApkError');
        }
    });

    // Check update & install.
    updater.checkUpdate();
}
