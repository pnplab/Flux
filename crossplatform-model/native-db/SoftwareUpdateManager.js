/**
 * @flow
 */
import { NativeModules, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import RNFS from 'react-native-fs';
import BugReporter from './BugReporter';
import { STUDY_URL } from '../../config';

const UpdateManagerNativeModule = NativeModules.SoftwareUpdateManager;

class SoftwareUpdateManager {

    isWifiActive = async (): Promise<boolean> => {
        // Ensure we are on wifi. Bypass upgrade check otherwise.
        let connectionInfo = await NetInfo.getConnectionInfo();
        if (connectionInfo.type === 'wifi') {
            return true;
        }
        else {
            console.info('wifi not available. bypassing upgrade check.');
            return false;
        }
    };

    retrieveUpdateInfoUncached = async (awareDeviceId: ?string): Promise<{
        androidVersionName: string,
        androidVersionCode: number,
        androidApkUrl: string,
        isUpdateOptional: string
    }> => {
        // Retrieve software update microservice url from study id
        // parameter. We don't have any better for now.
        const studyUrl = STUDY_URL;
        const [, serverUrl] = studyUrl.match(/^(https?:\/\/[^\/]+)\/.*/);

        // Retrieve latest release version from github.
        // @note eslint-disable-line used to disable fetch undefined error, has
        //     node doesn't have fetch although react-native has, cf.
        //     https://facebook.github.io/react-native/docs/network.

        // Retrieve current app version code.
        const currentApkInfo = this.getCurrentApkInfo();
        let baseAndroidVersionCode = currentApkInfo.versionCode;

        // Set production as default release channel. The release channel
        // is extrapolated from awareDeviceId format. We don't want to
        // upgrade to unstable channels if user has not yet authentificated.
        let releaseChannel: 'development' | 'testing' | 'production' = 'production';

        // Extrapolate release channel otherwise.
        if (typeof awareDeviceId === 'string' && awareDeviceId.startsWith('__')) {
            releaseChannel = 'development';
        }
        else if (typeof awareDeviceId === 'string' && awareDeviceId.startsWith('_')) {
            releaseChannel = 'testing';
        }

        // Retrieve latest version.json content.
        let url;
        if (typeof awareDeviceId === 'undefined') {
            url = `${serverUrl}/software-update-service/get-latest-version-for/android/${releaseChannel}/${baseAndroidVersionCode}`;
        }
        else {
            url = `${serverUrl}/software-update-service/get-latest-version-for/android/${releaseChannel}/${baseAndroidVersionCode}/${awareDeviceId}`;
        }

        // @warning can throw, but we catch at higher level.
        let releaseJsonResp = await fetch(url); // eslint-disable-line
        let releaseJson = await releaseJsonResp.json();
        
        console.log('release package info: ', releaseJson);

        const { androidVersionCode, androidVersionName, androidApkUrl, isUpdateOptional } = releaseJson;

        // Check json file formatting.
        if (typeof androidVersionCode !== 'number') {
            throw new Error('androidVersionCode should be a number.');
        }
        if (typeof androidVersionName !== 'string') {
            throw new Error('androidVersionName should be a string.');
        }
        if (typeof androidApkUrl !== 'string') {
            throw new Error('androidApkUrl should be a string.');
        }
        if (typeof isUpdateOptional !== 'boolean') {
            throw new Error('isUpdateOptional should be a boolean.');
        }

        // Return result.
        return releaseJson;
    }

    // Cache the result to avoid multiple useless request but also potential
    // mismatches in result between calls (ie. isOptional retrieved from
    // different request than apkUrl) if the server result has changed between
    // calls (can happen if we change the update server config at that moment,
    // very unlikely though).
    _retrieveUpdateInfoCache = null;
    retrieveUpdateInfo = async (awareDeviceId: ?string): Promise<{
        androidVersionName: string,
        androidVersionCode: number,
        androidApkUrl: string,
        isUpdateOptional: string
    }> => {
        if (this._retrieveUpdateInfoCache === null) {
            this._retrieveUpdateInfoCache = this.retrieveUpdateInfoUncached(awareDeviceId);
        }

        return this._retrieveUpdateInfoCache;
    }

    // Find out if a new update is available. The optional ability to have user
    // specific update is useful to apply bug fixes targeted to specfic user
    // devices for instance (or even features, ie. for patients that require
    // schedule-change).
    isSoftwareUpdateAvailable = async (awareDeviceId: ?string): Promise<boolean> => {
        // Return false when wifi is not active.
        let isWifiActive = await this.isWifiActive();
        if (!isWifiActive) {
            return false;
        }

        // Retrieve remote update info.
        let androidVersionCode, androidVersionName;
        try {
            let updateInfo = await this.retrieveUpdateInfo(awareDeviceId);
            androidVersionCode = updateInfo.androidVersionCode;
            androidVersionName = updateInfo.androidVersionName;
        }
        // If request failed, do not update. Probably due to internet not being
        // connected. Emulator happens to have DNS issue from time to time, cold
        // rebooting it work. The issue may be tested by opening android's
        // chrome and checking wikipedia for instance. This should work!
        catch (e) {
            console.error('Application auto update failed. Version couldn\'t be retrieved. The device is probably not currently connected to internet. On emulator, cold boot work.');
            console.error(e);
            BugReporter.notify('upgrade: Application auto update failed. Version couldn\'t be retrieved. The device is probably not currently connected to internet. On emulator, cold boot work.');
            BugReporter.notify(e);
            return false;
        }

        // Compare latest release version code with current one.
        const currentApkInfo = this.getCurrentApkInfo();
        const currentAndroidVersionCode = currentApkInfo.versionCode;
        // Stop now if same version.
        if (androidVersionCode === currentAndroidVersionCode) {
            console.info('current apk is up to date. androidVersionCode=' + currentAndroidVersionCode + ' androidVersionName=' + androidVersionName);
            return false;
        }
        // Stop and log error if new version is lower than previous one
        // @note This can happen if release channel is changed from release to
        //    development for instance. This is the case when user has not yet
        //    authentificated since release channel is extrapolated from
        //    awareDeviceId, otherwise to production by default.
        else if (androidVersionCode < currentAndroidVersionCode) {
            console.error('new version is older than previous one.', androidVersionCode, currentAndroidVersionCode);
            return false;
        }
        // Proceed to upgrade if new version is higher than previous one.
        else if (androidVersionCode > currentAndroidVersionCode) {
            console.info('new version is newer than previous one. upgrading.', androidVersionCode, currentAndroidVersionCode);
            BugReporter.breadcrumb('app upgrade ' + androidVersionCode + ' ' + currentAndroidVersionCode, 'log');
            return true;
        }
    }

    isSoftwareUpdateOptional = async (awareDeviceId: ?string): Promise<boolean> => {
        // Retrieve remote update info.
        let isUpdateOptional;
        try {
            let updateInfo = await this.retrieveUpdateInfo(awareDeviceId);
            isUpdateOptional = updateInfo.isUpdateOptional;
        }
        // If request failed, do not update. Probably due to internet not being
        // connected. Emulator happens to have DNS issue from time to time, cold
        // rebooting it work. The issue may be tested by opening android's
        // chrome and checking wikipedia for instance. This should work!
        catch (e) {
            console.error('Application auto update failed. Version couldn\'t be retrieved. The device is probably not currently connected to internet. On emulator, cold boot work.');
            console.error(e);
            BugReporter.notify('upgrade: Application auto update failed. Version couldn\'t be retrieved. The device is probably not currently connected to internet. On emulator, cold boot work.');
            BugReporter.notify(e);
            return true;
        }

        return isUpdateOptional;
    };

    // Store download job's id so we can cancel it later.
    _currentJobDownloadId = null;

    isApkDownloading = (): boolean => {
        return this._currentJobDownloadId !== null;
    }

    // You must be sure filepaths.xml exposes this path or you will have a
    // FileProvider error API24+. You might check `{totalSpace, freeSpace} = await
    // RNFS.getFSInfo()` to make sure there is room
    // path sample: `const outputPath = RNFS.CachesDirectoryPath+'/NewApp.apk';`
    downloadApk = async (
        inputUrl: string,
        outputPath: string,
        onStarted: () => void,
        onProgressed: (percentage: number) => void,
        onCompleted: (result: RNFS.DownloadResult) => void,
        onFailed: (err: Error) => void
    ) => {
        // Ensure apk is not already downloading.
        if (this._currentJobDownloadId !== null) {
            throw new Error('an apk is already downloading at the moment.');
        }

        // Patch SSL on android <= 20 (Kitkat).
        await this.patchSslProvider();

        // Download remote file.
        let { jobId, promise } = RNFS.downloadFile({
            fromUrl: inputUrl,
            toFile: outputPath,
            begin: res => {
                if (typeof onStarted === 'undefined') {
                    return;
                }
                else {
                    onStarted();
                }
            },
            progress: data => {
                if (typeof onProgressed === 'undefined') {
                    return;
                }
                else {
                    let percentage = ((100 * data.bytesWritten) / data.contentLength) | 0;
                    onProgressed(percentage);
                }
            },
            background: true,
            progressDivider: 1
        });

        // Set the download job id (used to stop the download).
        this._currentJobDownloadId = jobId;

        // Wait till download ends.
        let downloadResult = undefined;
        try {
            // Wait for promise.
            downloadResult = await promise;
        }
        // Cleanup and forward exception on error.
        catch(e) {
            this._currentJobDownloadId = null;
            onFailed(e);
            return;
        }

        // ...download is now finished.

        // Forward error in case of bad HTTP result. Error has probably already
        // been thrown at `await promise` but for safety, we do additional
        // check.
        if (downloadResult.statusCode < 200 || downloadResult.statusCode >= 300) {
            this._currentJobDownloadId = null;
            let err = new Error('invalid http status code ' + downloadResult.statusCode);
            onFailed(err);
        }

        // Reset download job id.
        this._currentJobDownloadId = null;

        // Forward download completed.
        onCompleted(downloadResult)
    }

    stopApkDownload = (): boolean => {
        // Return false if there is no download at the moment.
        if (this._currentJobDownloadId === null) {
            return false;
        }
        // Stop the download and return true otherwise.
        else {
            RNFS.stopDownload(this._currentJobDownloadId);
            return true;
        }
    }

    getCurrentApkInfo = (): {
        versionName: string,
        versionCode: number,
        packageName: string,
        packageInstaller: string,
        signatures: string
    } => {
        let {
            versionName,
            versionCode,
            packageName,
            packageInstaller,
            signatures
            // ...not used currently:
            // firstInstallTime,
            // lastUpdateTime,
        } = UpdateManagerNativeModule;

        return {
            path: undefined,
            versionName,
            versionCode,
            packageName,
            packageInstaller,
            signature: signatures[0].thumbprint
        };
    }

    getApkInfo = async (apkPath: string): {
        versionName: string,
        versionCode: number,
        packageName: string,
        packageInstaller: string,
        signatures: string
    } => {
        let {
            versionName,
            versionCode,
            packageName,
            packageInstaller,
            signatures
        } = await UpdateManagerNativeModule.getApkInfo(apkPath);

        return {
            path: apkPath,
            versionName,
            versionCode,
            packageName,
            packageInstaller,
            signature: signatures[0].thumbprint
        };
    }

    // `isInstallFromUnknownSourceEnabled` method is used to know whether a
    // permission request dialog for unknown installation source will be asked
    // or not. We use this method to display additional indication to the user.
    // We could use it to suggest to revoke the settings once the update has
    // occured as well.
    isInstallFromUnknownSourceEnabled = async (): Promise<boolean> => {
        return UpdateManagerNativeModule.isInstallFromUnknownSourceEnabled();
    }

    // @pre-condition Check apk signing is compatible so we can start
    // installation.
    installApk = (fileProviderAuthority: string, apkPath: string) => {
        // @todo feedback.
        UpdateManagerNativeModule.installApk(
            apkPath,
            fileProviderAuthority
        );
    }

    patchSslProvider = async (suggestGooglePlayInstall: boolean = false) => {
        // Bypass if we're not on android.
        if (Platform.OS !== 'android') {
            // ...do nothing, no need to patch anything.
        }
        // Install google play as a fix for SSL breaking on android < 20 (max
        // kitkat). Will reject with exception on error, or return true on success.
        else {
            const installGooglePlayWhenNotNeeded = false;
            await UpdateManagerNativeModule.patchSSLProvider(installGooglePlayWhenNotNeeded, suggestGooglePlayInstall);
        }
    }

}

export default new SoftwareUpdateManager();