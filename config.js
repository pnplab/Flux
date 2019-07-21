/** 
 * @flow
 * 
 * I wasn't able to manually set process.env variables in jest test using the 
 * root App component.  
 * 
 * These approaches and any associations were tried prior to using a standard
 * config file:
 * - using `process.env = { ... }`.
 * - using `jest.resetModules();` // see `https://code-examples.net/en/q/2dcf031`
 * - using `process.env = Object.assign(process.env, { ... });` // see `https://stackoverflow.com/questions/48033841/test-process-env-with-jest/48042799`
 * - using  either `jest.mock()` or `jest.doMock()` with `require` instead of 
 *   `import` to ensure correct loading order.
 * - doing this in `beforeEach` method, outside etc.
 * 
 * Thus, in order to be able to test the main App component, we put all the
 * env config in this file. This allow for `jest.mock()` usage. This also make
 * it easier to check the env values in a single place.
 */

// To ensure process.env is not used outside this file, we do lint its usage.
// This is configured through`.eslintrc.js` eslint config file. The following
// line exempt this file from this rule.
/* eslint no-process-env: "off" */

// Ensure encryption key has been set through process' env variable.
if (typeof process.env.FLUX_ENCRYPTION_KEY === 'undefined') {
    throw new Error('process.env.FLUX_ENCRYPTION_KEY is undefined!');
}

// Retrieve study url from env (so we can use 10.0.2.2 android-studio 
// debugger's proxy on local debug server, or through ngrok proxy, or
// pnplab.ca on official app).
if (typeof process.env.STUDY_URL === 'undefined' || process.env.STUDY_URL === null) {
    throw new Error('Undefined STUDY_URL in env!');
}

// These are used by onboarding to know which sql tables are synced and thus should be tested.
if (typeof process.env.SYNCED_TABLES === 'undefined') {
    throw new Error('process.env.SYNCED_TABLES is undefined!');
}

// Used for crash report API.
if (typeof process.env.SENTRY_DSN === 'undefined') {
    throw new Error('SENTRY_DSN env variable should be set in order to enable bug reporting!');
}

// Used for crash report API.
if (typeof process.env.BUGSNAG_API_KEY === 'undefined') {
    throw new Error('BUGSNAG_API_KEY env variable should be set in order to enable bug reporting!');
}

export const DEV = __DEV__; /* eslint-disable-line no-undef */ // cf. `https://facebook.github.io/react-native/docs/javascript-environment.html`
export const FLUX_AUTO_UPDATE = process.env.FLUX_AUTO_UPDATE;
export const FLUX_ENCRYPTION_KEY = process.env.FLUX_ENCRYPTION_KEY;
export const STUDY_URL = process.env.STUDY_URL;
export const SYNCED_TABLES = process.env.SYNCED_TABLES;
export const CI_COMMIT_SHORT_SHA = process.env.CI_COMMIT_SHORT_SHA;
export const BUGSNAG_API_KEY = process.env.BUGSNAG_API_KEY;
export const SENTRY_DS = process.env.SENTRY_DS;