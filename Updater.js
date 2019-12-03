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
import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import RNFS from 'react-native-fs';
import * as UpdateManager from './crossplatform-model/native-db/UpdateManager';
import BugReporter from './crossplatform-model/native-db/BugReporter';

export async function triggerUpdateIfNeeded() {
    // Ensure we are on wifi. Bypass upgrade check otherwise.
    let connectionInfo = await NetInfo.getConnectionInfo();
    if (connectionInfo.type !== 'wifi') {
        console.info('wifi not available. bypassing upgrade check.');
        return;
    }

    // Fetch the updater version package of the last github release.
    // @todo change to a notification system instead.
    let releaseJson;
    try {
        // Retrieve latest release version from github.
        // @note eslint-disable-line used to disable fetch undefined error, has
        //     node doesn't have fetch although react-native has, cf.
        //     https://facebook.github.io/react-native/docs/network.

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
    // If request failed, do not update. Probably due to internet not being
    // connected. Emulator happens to have DNS issue from time to time, cold
    // rebooting it work. The issue may be tested by opening android's chrome
    // and checking wikipedia for instance. This should work!
    catch (e) {
        console.error('Application auto update failed. Github version could\'nt be retrieved. The device is probably not currently connected to internet. On emulator, cold boot work.');
        console.error(e);
        BugReporter.notify('upgrade: Application auto update failed. Github version could\'nt be retrieved. The device is probably not currently connected to internet. On emulator, cold boot work.');
        BugReporter.notify(e);
        return;
    }

    console.log('release package info: ', releaseJson);

    const { versionCode, versionName, forceUpdate, apkUrl } = releaseJson;

    // Compare latest release version code with current one.
    const currentApkInfo = UpdateManager.getCurrentApkInfo();
    const currentVersionCode = currentApkInfo.versionCode;
    // Stop now if same version.
    if (versionCode === currentVersionCode) {
        console.info('current apk is up to date. versionCode='+currentVersionCode+' versionName='+versionName);
        return;
    }
    // Stop and log error if new version is lower than previous one.
    else if (versionCode < currentVersionCode) {
        console.error('new version is older than previous one.', versionCode, currentVersionCode);
        BugReporter.notify('upgrade: new version is older than previous one. ' + versionCode + ' ' + currentVersionCode);
        return;
    }
    // Proceed to upgrade if new version is higher than previous one.
    else if (versionCode > currentVersionCode) {
        console.info('new version is newer than previous one. upgrading.', versionCode, currentVersionCode);
        BugReporter.breadcrumb('app upgrade ' + versionCode + ' ' + currentVersionCode, 'log');
    }

    // Check forceUpdate.
    if (!forceUpdate) {
        console.info('remote forceUpdate is false. bypassing update.');
        return;
    }

    // Assert apk is not downloading at the moment (should always be false since
    // launch is only triggered once at app launch).
    const isApkDownloading = await UpdateManager.isApkDownloading();
    if (isApkDownloading) {
        console.error('assert: apk already downloading (should never happen).');
        BugReporter.notify('upgrade: assert apk already downloading failed (should never happen).');
        BugReporter.breadcrumb('apk upgrade failure', 'log');
        return;
    }

    // Delete flux upgrade file if it already exists.
    // @todo check apk version code to avoid redownload if unnecessary.
    const fileAlreadyExists = await RNFS.exists(RNFS.CachesDirectoryPath + '/FluxUpgrade.apk');
    if (fileAlreadyExists) {
        try {
            await RNFS.unlink(RNFS.CachesDirectoryPath + '/FluxUpgrade.apk');
        }
        catch (e) {
            BugReporter.notify('upgrade: unlink failed');
            BugReporter.breadcrumb('apk upgrade failure', 'log');
            return;
        }
    }

    // Check enough free space is available. Alert in case of issue.
    // @notes results are in bytes. cf. https://github.com/itinance/react-native-fs#getfsinfo-promisefsinforesult.
    const { totalSpace, freeSpace } = await RNFS.getFSInfo();
    if (freeSpace < 75000000) {
        let freeSpaceInMo = freeSpace / 1000000;
        freeSpaceInMo = freeSpaceInMo / 1000 * 1024;
        freeSpaceInMo = Math.round(freeSpaceInMo) + 1;
        console.error('not enough diskpace for upgrade ', freeSpace, 'out of', totalSpace, 'available');
        Alert.alert('Une mise à jour de Flux est disponible.', 'La mise à jour requiert 75mo d\'espace disque. Votre espace disque est insuffisant. Veuillez libérer ' + freeSpaceInMo + 'mo sur votre téléphone et redémarrer l\'application lorsque vous avez suffisament d\'espace disque disponible.');
        BugReporter.notify('upgrade: not enough diskpace for upgrade ' + freeSpace + ' out of ' + totalSpace + ' available');
        BugReporter.breadcrumb('apk upgrade failure', 'log');
        return;
    }

    // Download new apk.
    try {
        Alert.alert('Une mise à jour de Flux disponible.', 'Veuillez patienter quelques minutes. Une alerte va s\'afficher en cas de succès ou d\'erreur.');
        BugReporter.breadcrumb('app upgrade download', 'log');
        await UpdateManager.downloadApk(apkUrl, RNFS.CachesDirectoryPath + '/FluxUpgrade.apk');
    }
    catch (e) {
        // apk download failure.
        // @todo validate this use case is triggered. depends on RNFS.
        console.error('apk upgrade file download failed.');
        console.error(e);
        BugReporter.notify('upgrade: apk upgrade file download failed');
        BugReporter.notify(e);
        BugReporter.breadcrumb('apk upgrade failure', 'log');
        Alert.alert('Le téléchargement de la mise à jour à échouer. Vous pouvez continuer à utiliser Flux.');
        return;
    }

    // ...once downloaded.
    // Compare latest release apk signature with current apk signature.
    // Signature mismatch may happen in case of debug w/ release build upgrade
    // for instance.
    let newApkInfo;
    try {
        newApkInfo = await UpdateManager.getApkInfo(RNFS.CachesDirectoryPath + '/FluxUpgrade.apk');
    }
    catch (e) {
        console.error('couldn\'t read downloaded apk info.');
        Alert.alert('Le téléchargement de la mise à jour à échouer. Vous pouvez continuer à utiliser Flux.');
        BugReporter.notify('upgrade: couldn\'t read downloaded apk info');
        BugReporter.notify(e);
        return;
    }
    if (newApkInfo.signature !== currentApkInfo.signature) {
        console.error('signature mismatch between new apk and current one.', newApkInfo.signature, currentApkInfo.signature);
        BugReporter.notify('upgrade: signature mismatch between new apk and current one.' + ' ' + newApkInfo.signature + ' ' + currentApkInfo.signature);
        BugReporter.breadcrumb('apk upgrade failure', 'log');
        Alert.alert('Le téléchargement de la mise à jour à échouer. Vous pouvez continuer à utiliser Flux.');
        return;
    }

    // Show alert.
    Alert.alert(
        'Mise à jour de Flux disponible',
        'Veuillez procéder à la mettre à jour de l\'application Flux.',
        [
            {
                text: 'OK',
                onPress: () => {
                    // Install apk.
                    UpdateManager.installApk(
                        'org.pnplab.flux.provider.storage',
                        RNFS.CachesDirectoryPath + '/FluxUpgrade.apk'
                    );

                    // Log install.
                    BugReporter.notify('Install triggered');
                    BugReporter.breadcrumb('apk upgrade triggered', 'log');
                }
            }
        ]
    );
}
