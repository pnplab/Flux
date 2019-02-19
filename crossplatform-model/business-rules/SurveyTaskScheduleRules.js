/**
 * @flow
 *
 * Only allow the experiment to be started by the end user between 18 & 21pm. 
 * If started near 21pm, ensure it's not kept open all day long by killing it
 * at 21pm30.
 */ 

export const OPENING_HOUR = 18;
export const CLOSING_HOUR = 22;

// const OPENING_HOUR = 18;
// const CLOSING_HOUR = 21;

// Method useful to set the default state in the redux store when the app
// opens.
export const shouldSurveyTaskBeEnabled = (lastSurveySubmissionTime = undefined) => {
    return true;
    // Always return true on dev so we can test.
    if (__DEV__) {
        return true;
    }
    if (typeof lastSurveySubmissionTime === 'undefined') {
        // Get the hour (0-23)
        let currentHour = new Date().getHours();
        let shouldFirstSurveyTaskBeEnabled = currentHour >= OPENING_HOUR && currentHour < CLOSING_HOUR;
        return shouldFirstSurveyTaskBeEnabled;
    }
    else {
        return lastSurveySubmissionTime < getLastSurveyOpeningTime();
    }
};

export const getLastSurveyOpeningTime = () => {
    // @warning doesn't work if last opening is set with minutes.
    // @todo adapt to multiple studies, eg. ones that have weekly resting-state`
    //      experiments.

    let currentTime = (new Date()).getTime();

    let mins = 0;
    
    let currentHour = new Date().getHours();
    let lastOpeningHour = OPENING_HOUR;

    let isLastOpeningToday = lastOpeningHour <= currentHour;
    let hourStamp = undefined;
    if (isLastOpeningToday) {
        // Last opening happened today.
        let today = new Date();
        return today.setHours(OPENING_HOUR, 0, 0, 0);
    }
    else {
        // Last opening happened yesterday (since it didn't happen today).
        let yesterday = ( d => new Date(d.setDate(d.getDate()-1)) )(new Date);
        return yesterday.setHours(OPENING_HOUR, 0, 0, 0);
    }

    return hourStamp;
};
