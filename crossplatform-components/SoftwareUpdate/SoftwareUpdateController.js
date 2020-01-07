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
 *
 * @todo remove unused FLUX_AUTO_UPDATE constant.
 * @todo check downloaded apk version code (if exists) to avoid redownload if unnecessary.
 * @todo display missing space to user. should retrieve official apk
 *     size first.
 *
 * This is commented in js
 *     source as android related code is within a dependency and thus not in
 *     git repository.
 * @note Android Oreo doesn't need to enable unknown source, but instead uses
 *     a perm cf. https://www.androidcentral.com/unknown-sources
 * @note Android EXTRA_NOT_UNKNOWN_SOURCE intent parameter to bypass the enable
 *     unknown source setting is misdocumented and doesn't work cf.
 *     https://issuetracker.google.com/issues/36963283.
 * @note Android PackageManager#canRequestPackageInstalls always return false
 *     on API < Oreo cf. https://stackoverflow.com/questions/47872162/how-to-use-packagemanager-canrequestpackageinstalls-in-android-oreo
 */

import React, { PureComponent } from 'react';
import { View } from 'react-native';
import RNFS from 'react-native-fs';

import SoftwareUpdateManager from '../../crossplatform-model/native-db/SoftwareUpdateManager';
import BugReporter from '../../crossplatform-model/native-db/BugReporter';
import RequestDownloadView from './RequestDownloadView';
import ErrorView from './ErrorView';
import NotEnoughSpaceView from './NotEnoughSpaceView';
import DownloadProgressView from './DownloadProgressView';
import RequestInstallView from './RequestInstallView';

// Configure types.
type Props = {
    +onUpdateBypass: () => void,
    +awareDeviceId: string, // store device id as well because it's sometimes
    // used by the software update system to filter upgrade to certain devices.
    +isUpdateOptional: boolean
};
type State = {
    +currentStep: Step,
    +hasDownloadBeenTrigger: boolean, // keep state in order to avoid dual click on button.
    +downloadPercentage: ?number,
    +isInstallFromUnknownSourceEnabled: ?boolean
};
export type Step = 'REQUEST_DOWNLOAD'
    | 'NOT_ENOUGH_SPACE'
    | 'DOWNLOAD_PROGRESS'
    | 'DOWNLOAD_ERROR'
    | 'REQUEST_INSTALL';

// Configure component logic.
export default class SoftwareUpdateController extends PureComponent<Props, State> {

    // Set displayName for debug and bugreport navigation tracing.
    static displayName = 'SoftwareUpdate';

    constructor(props: Props) {
        super(props);

        this.state = {
            currentStep: 'REQUEST_DOWNLOAD',
            hasDownloadBeenTrigger: false,
            downloadPercentage: undefined,
            isInstallFromUnknownSourceEnabled: undefined
        };
    }

    async componentDidMount() {
        // Check whether to show how to enable installation from unknown source
        // or not.
        let isInstallFromUnknownSourceEnabled = await SoftwareUpdateManager.isInstallFromUnknownSourceEnabled();
        this.setState({ isInstallFromUnknownSourceEnabled });
    }

    render() {
        let innerView;

        switch(this.state.currentStep) {
        case 'REQUEST_DOWNLOAD':
            innerView = <RequestDownloadView
                showSkipButton={this.props.isUpdateOptional}
                onSkipPress={this.bypassUpdate}
                disableDownloadButton={this.state.hasDownloadBeenTrigger}
                onDownloadPress={this.startDownload}
                onDownloadLongPress={this.bypassUpdate}
            />;
            break;
        case 'NOT_ENOUGH_SPACE':
            // @todo auto reload data.
            innerView = <NotEnoughSpaceView />;
            break;
        case 'DOWNLOAD_PROGRESS':
            innerView = <DownloadProgressView percentage={this.state.downloadPercentage} />;
            break;
        case 'DOWNLOAD_ERROR':
            innerView = <ErrorView />;
            break;
        case 'REQUEST_INSTALL':
            innerView = <RequestInstallView isInstallFromUnknownSourceEnabled={this.state.isInstallFromUnknownSourceEnabled} onPress={this.installUpdate} onLongPress={this.bypassUpdate} />;
            break;
        default:
            throw new Error('Unexpected step for SoftwareUpdate controller');
        }

        return (
            <View accessibilityLabel="software.update" style={{ flex: 1 }}>
                {innerView}
            </View>
        );
    }

    bypassUpdate = () => {
        this.props.onUpdateBypass();
    }

    startDownload = async () => {
        // Update state in order to disable download button and avoid dual
        // download issues.
        this.setState({ hasDownloadBeenTrigger: true });

        // Assert apk is not downloading at the moment (should always be false since
        // launch is only triggered once at app launch).
        const isApkDownloading = await SoftwareUpdateManager.isApkDownloading();
        if (isApkDownloading) {
            console.error('assert: apk already downloading (should never happen).');
            BugReporter.notify('update: assert apk already downloading failed (should never happen).');
            BugReporter.breadcrumb('apk update failure', 'log');
            return;
        }

        // Delete flux update file if it already exists.
        // @todo check apk version code to avoid redownload if unnecessary.
        const fileAlreadyExists = await RNFS.exists(RNFS.CachesDirectoryPath + '/FluxUpdate.apk');
        if (fileAlreadyExists) {
            try {
                console.info('removing existing apk file.');
                await RNFS.unlink(RNFS.CachesDirectoryPath + '/FluxUpdate.apk');
                BugReporter.breadcrumb('apk downloaded file unlink', 'log');
            }
            catch (e) {
                console.error(e);
                BugReporter.notify('update: unlink failed');
                BugReporter.breadcrumb('apk update failure', 'log');

                // ... ignore error.
                return;
            }
        }

        // Display error if disk space is too low.
        // @notes results are in bytes. cf. https://github.com/itinance/react-native-fs#getfsinfo-promisefsinforesult.
        // @todo display missing space to user. should retrieve official apk
        // size first.
        const { totalSpace, freeSpace } = await RNFS.getFSInfo();
        if (freeSpace < 100000000) {
            let freeSpaceInMo = freeSpace / 1000000;
            freeSpaceInMo = freeSpaceInMo / 1000 * 1024;
            freeSpaceInMo = Math.round(freeSpaceInMo) + 1;

            // Log issue.
            console.error('not enough diskpace for update ', freeSpace, 'out of', totalSpace, 'available');
            BugReporter.notify('update: not enough diskpace for update ' + freeSpace + ' out of ' + totalSpace + ' available');
            BugReporter.breadcrumb('apk update failure', 'log');

            // Switch to not enough space view.
            this.setState({ currentStep: 'NOT_ENOUGH_SPACE' });
            return;
        }

        // Retrieve apk url link to download.
        let androidApkUrl;
        try {
            const updateInfo = await SoftwareUpdateManager.retrieveUpdateInfo(this.props.awareDeviceId);
            androidApkUrl = updateInfo.androidApkUrl;
        }
        // If request failed, do not update. Probably due to internet not being
        // connected. Emulator happens to have DNS issue from time to time, cold
        // rebooting it work. The issue may be tested by opening android's
        // chrome and checking wikipedia for instance. This should work!
        catch(e) {
            // Log error.
            console.error('Application auto update failed. Version couldn\'t be retrieved. The device is probably not currently connected to internet. On emulator, cold boot work.');
            console.error(e);
            BugReporter.notify('upgrade: Application auto update failed. Version couldn\'t be retrieved. The device is probably not currently connected to internet. On emulator, cold boot work.');
            BugReporter.notify(e);

            // Display error screen.
            this.setState({ currentStep: 'DOWNLOAD_ERROR' });
            return;
        }

        // Log download is starting.
        BugReporter.breadcrumb('app update download started', 'log');

        // Switch to the download progress screen.
        this.setState({ currentStep: 'DOWNLOAD_PROGRESS' });

        // Start download.
        await SoftwareUpdateManager.downloadApk(
            // Set remote apk download link.
            androidApkUrl,
            // Set local apk output path.
            RNFS.CachesDirectoryPath + '/FluxUpdate.apk',
            // download starts: Update download percentage state.
            () => {
                this.setState({ downloadPercentage: 0 });
            },
            // download progresses: Update download percentage.
            (percentage: number) => {
                this.setState({ downloadPercentage: percentage });
            },
            // download has finished: Log event and request update install.
            async (result) => {
                BugReporter.breadcrumb('app update download finished', 'log');

                // ...once downloaded.

                // Compare latest release apk signature with current apk
                // signature. Signature mismatch may happen in case of debug w/
                // release build upgrade for instance.
                const currentApkInfo = await SoftwareUpdateManager.getCurrentApkInfo();
                let newApkInfo;

                // Retrieve new apk info so we can verify signature is compatible.
                try {
                    newApkInfo = await SoftwareUpdateManager.getApkInfo(RNFS.CachesDirectoryPath + '/FluxUpdate.apk');
                }
                // Log (probably) corrupted apk in case of issue reading apk
                // info and forward user to error screen.
                catch (e) {
                    // Log error.
                    console.error('couldn\'t read downloaded apk info.');
                    BugReporter.notify('upgrade: couldn\'t read downloaded apk info');
                    BugReporter.notify(e);

                    // Switch to error screen.
                    this.setState({ currentStep: 'DOWNLOAD_ERROR' });
                    return;
                }

                // Log signature mismatch (this shouldn't happen except if
                // android signature to generate apk has changed - or some kind
                // of unlikely man in the middle apk attack).
                if (newApkInfo.signature !== currentApkInfo.signature) {
                    // Log error.
                    console.error('signature mismatch between new apk and current one.', newApkInfo.signature, currentApkInfo.signature);
                    BugReporter.notify('upgrade: signature mismatch between new apk and current one.' + ' ' + newApkInfo.signature + ' ' + currentApkInfo.signature);
                    BugReporter.breadcrumb('apk upgrade failure', 'log');

                    // Switch to error screen.
                    this.setState({ currentStep: 'DOWNLOAD_ERROR' });
                    return;
                }
                // Switch to install request screen if download and checkup
                // went allright.
                else {
                    this.setState({ currentStep: 'REQUEST_INSTALL' });
                }
            },
            // download has failed: Log and display error.
            // @todo validate this use case is triggered. depends on RNFS.
            (e) => {
                // Log error.
                console.error('apk update file download failed.');
                console.error(e);
                BugReporter.notify('update: apk update file download failed');
                BugReporter.notify(e);
                BugReporter.breadcrumb('apk update failure', 'log');

                // Switch to error screen.
                this.setState({ currentStep: 'DOWNLOAD_ERROR' });
                return;
            }
        );
    }

    installUpdate = async () => {
        // Trigger apk installation screen.
        SoftwareUpdateManager.installApk(
            'org.pnplab.flux.provider.storage',
            RNFS.CachesDirectoryPath + '/FluxUpdate.apk'
        );

        // Log installation triggered.
        BugReporter.notify('update: install triggered');
        BugReporter.breadcrumb('apk upgrade triggered', 'log');
    }

}