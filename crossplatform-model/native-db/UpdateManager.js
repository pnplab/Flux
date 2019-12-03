import { NativeModules, Platform } from 'react-native';
import RNFS from 'react-native-fs';

const RNUpdateAPK = NativeModules.RNUpdateAPK;

// Store download job's id so we can cancel download.
let _currentJobDownloadId = null;

export const isApkDownloading = () => {
    return _currentJobDownloadId !== null;
};

// You must be sure filepaths.xml exposes this path or you will have a
// FileProvider error API24+. You might check `{totalSpace, freeSpace} = await
// RNFS.getFSInfo()` to make sure there is room
// path sample: `const outputPath = RNFS.CachesDirectoryPath+'/NewApp.apk';`
export const downloadApk = async (inputUrl, outputPath, onStarted, onProgressed) => {
    // Ensure apk is not already downloading.
    if (_currentJobDownloadId !== null) {
        throw new Error('an apk is already downloading at the moment.');
    }

    // Patch SSL on android <= 20 (Kitkat).
    await patchSslProvider();

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
    _currentJobDownloadId = jobId;

    // Wait till download ends.
    let downloadResult = await promise;

    // Throw error in case of bad HTTP result. Error is probably already thrown
    // at `await promise` but for safety, we do additional check.
    if (downloadResult.statusCode < 200 || downloadResult.statusCode >= 300) {
        throw new Error('invalid http status code ' + downloadResult.statusCode);
    }

    // Reset download job id.
    _currentJobDownloadId = null;

    return downloadResult;
};

export const stopApkDownload = () => {
    RNFS.stopDownload(jobId);
};

export const getCurrentApkInfo = () => {
    let {
        versionName,
        versionCode,
        packageName,
        firstInstallTime,
        lastUpdateTime,
        packageInstaller,
        signatures
    } = RNUpdateAPK;

    return {
        path: undefined,
        versionName,
        versionCode,
        packageName,
        packageInstaller,
        signature: signatures[0].thumbprint
    };
};

export const getApkInfo = async (apkPath) => {
    let {
        versionName,
        versionCode,
        packageName,
        packageInstaller,
        signatures
    } = await RNUpdateAPK.getApkInfo(apkPath);

    return {
        path: apkPath,
        versionName,
        versionCode,
        packageName,
        packageInstaller,
        signature: signatures[0].thumbprint
    };
};

// @pre-condition Check apk signing is compatible so we can start installation.
export const installApk = (fileProviderAuthority, apkPath) => {
    // @todo feedback.
    RNUpdateAPK.installApk(
        apkPath,
        fileProviderAuthority
    );
};

export const patchSslProvider = async (suggestGooglePlayInstall = false) => {
    // Bypass if we're not on android.
    if (Platform.OS !== 'android') {
        return true;
    }
    // Install google play as a fix for SSL breaking on android < 20 (max
    // kitkat). Will reject with exception on error, or return true on success.
    else {
        const installGooglePlayWhenNotNeeded = false;
        await RNUpdateAPK.patchSSLProvider(installGooglePlayWhenNotNeeded, suggestGooglePlayInstall);
        return true;
    }
};
