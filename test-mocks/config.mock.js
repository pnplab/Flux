/**
 * @flow
 * 
 * Mock environment variables, for Unit/Integration Testing (not e2e testing,
 * which tests over built version of the app and thus can't use mock).
 * 
 * I wasn't able to manually set process.env variables in jest test using the 
 * root App component.  
 * 
 * These approaches and any associations were tried prior to using a standard
 * config file:
 * - using`process.env = { ... }`.
 * - using`jest.resetModules();` // see `https://code-examples.net/en/q/2dcf031`
 * - using`process.env = Object.assign(process.env, { ... });` // see `https://stackoverflow.com/questions/48033841/test-process-env-with-jest/48042799`
 * - using  either`jest.mock()` or`jest.doMock()` with `require` instead of
 * `import` to ensure correct loading order.
 * - doing this in `beforeEach` method, outside etc.
 */

jest.mock('../config', () => {
    return {
        FLUX_ENCRYPTION_KEY: 'abcd',
        STUDY_URL: 'http://10.0.2.2:8888/index.php/webservice/index/1/myInexistantStudy' // Just to setup a value, will never be used.
    };
});
