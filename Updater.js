// @warning package deprecated according to https://github.com/parryworld/react-native-appupdate.
// Update/discard or turn to https://github.com/odemolliens/react-native-app-update
import AppUpdate from "react-native-appupdate";

export async function triggerUpdateIfNeeded() {
    // Fetch the updater version package of the last github release.
    // @todo change to a notification system instead.
    let releaseJsonResp = await fetch('https://api.github.com/repos/pnplab/Flux/releases/latest');
    let releaseJson = await releaseJsonResp.json();
    let updaterVersionPackage = releaseJson
        .assets
        .filter(a => a.name === "version.json")[0]
        .browser_download_url;

    // Generate updater.
    const updater = new AppUpdate({
        // iosAppId: "123456",
        apkVersionUrl: updaterVersionPackage,
        needUpdateApp: (needUpdate) => {
            // Trigger the update without asking the user !
            needUpdate(true);
        },
        forceUpdateApp: () => {
            // Forced update, found from the version.json
            console.log("Force update will start")
        },
        notNeedUpdateApp: () => {
            console.log("App is up to date")
        },
        downloadApkStart: () => { console.log("Start") },
        downloadApkProgress: (progress) => { console.log(`Downloading ${progress}%...`) },
        downloadApkEnd: () => { console.log("End") },
        onError: () => { console.log("downloadApkError") }
    });

    // Check update & install.
    updater.checkUpdate();
};
