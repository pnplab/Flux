/**
 * @flow
 *
 * @warning
 * Package deprecated according to https://github.com/parryworld/react-native-appupdate.
 * Official page recommand to switch to https://github.com/odemolliens/react-native-app-update.
 * However, the latter doesn't handle app apk downlaod etc. It seems to merely
 * be a wrapper that release diff versions in AppStore/Google Play.
 */
import AppUpdate from 'react-native-appupdate';
import { Alert } from 'react-native';

export async function triggerUpdateIfNeeded() {
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
    // connected.
    catch (e) {
        console.warn('Application auto update failed. Github version could\'nt be retrieved. The device is probably not currently connected to internet.');
        return;
    }

    // Generate updater.
    const updater = new AppUpdate({
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
            Alert.alert(`Downloading ${progress}%...`);
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
