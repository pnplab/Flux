
import AwareManager from '../crossplatform-model/native-db/AwareManager';
import AppController from '../crossplatform-components/AppController';
let App;

export async function setup() {
    // await AwareManager.requestPermissions();
    // await AwareManager.startAware('test');
    // await AwareManager.joinStudy('https://www.pnplab.ca/index.php/webservice/index/2/UvxJCl3SC4J3');
    App = new AppController({});

    try {
        await App.startAware('test');
        await App.joinAwareStudy();
        AwareManager.disableMandatoryWifiForSync();
        AwareManager.disableMandatoryBatteryForSync();
    }
    catch (e) {
        // Ignore "setState in unmounted app component warning".
    }
}

export async function tearDown() {
    AwareManager.stopAware();
}

export async function run() {
    await storeSurvey();
}

export async function storeSurvey() {
    console.log('sync?')
    storeSurvey({ abcd: 0.31 /* empty :D */ });
    AwareManager.syncData();
}



// try {
//     await Tests.setup();
//     await Tests.run();
// }
// catch (e) {
//     console.error(e);
// }
