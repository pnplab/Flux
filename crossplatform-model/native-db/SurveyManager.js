/**
 * @flow
 */
import { NativeModules } from 'react-native';

const SurveyTaskNativeModule = NativeModules.SurveyTask;

class SurveyManager {

    storeSurveyData = (timestamp: number, payload: {| [questionId: string]: number |}) => {
        // We use long for timestamp as it's defined in milisecond (> 2^32),
        // both in default javascript `new date().getTime()` result & in aware.
        // Following aware's convention is mandatory as it's used to verify in
        // syncing as not been done already. @ReactMethod's bridge doesn't
        // support long but only int so we first have to convert it to string
        // then 64b long.
        let timestamp64bInString = `${timestamp}`;

        SurveyTaskNativeModule.storeSurveyData(timestamp64bInString, payload);
    }

}

export default new SurveyManager();