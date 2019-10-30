/**
 * @flow
 */

import 'react-native';

// @note test renderer must be required after react-native.
import { flushMicrotasksQueue } from 'react-native-testing-library';

import { unswallow } from '../Utils';

// Fixes `ReferenceError: You are trying to `import` a file after the Jest
// environment has been torn down.`. Appearing among other things when using 
// animated components (such as somes in `native-base`, so as many places in 
// our interface). see `https://github.com/facebook/jest/issues/4359` and
// `https://github.com/facebook/jest/issues/6434`.
jest.useFakeTimers();

describe('Utils', () => {
    
    describe('Utils#unswallow(fn: Function): Function', () => {

        // This test has been disabled since we want to use unswallow on
        // user-defined method and thus have no idea of what the return type
        // may be.
        xit('should warn when its input function is not async / does not return a Promise', () => {
            // Spy on the console.warn method. 
            const spy = jest.spyOn(global.console, 'warn').mockImplementation(() => { }); // spy console.warn method so we can see if it has logged an issue.

            // Given we have wrapped a synchronous function with our unswallow
            // helper.
            // $flow-disable-line
            const wrappedSyncFunction = unswallow(() => { });

            // When we call our synchronous function.
            // $flow-disable-line
            wrappedSyncFunction();

            // Then, it should warn the method shouldn't have been wrapped as 
            // it isn't async.
            const consoleWarnInput = spy.mock.calls[0][0];
            expect(consoleWarnInput).toBeInstanceOf(Error);
            expect(consoleWarnInput.message).toBe('Utils#unswallow should not be called with synchronous function. Use try/catch instead.');

            // Remove console.warn spy.
            spy.mockRestore();
        });

        it('should passthrough non-function input such as undefined', () => {
            // Given an undefined value.
            const wrappedUndefined = unswallow(undefined);

            // Then, return should stay an undefined value.
            expect(wrappedUndefined).toBe(undefined);
        });

        it('should wrap its asynchronous input function with console.error error handler by default', async () => {
            // Spy on the console.error method. 
            const spy = jest.spyOn(global.console, 'error').mockImplementation(() => { }); // spy console.error method so we can see if it has logged an issue.

            // Given we have wrapped a throwing asynchronous function with our
            // unswallow helper.
            const wrappedAsyncFunction = unswallow(async () => { throw new Error('random error 1'); });

            // When we call our wrapped asynchronous function.
            const code = () => {
                wrappedAsyncFunction();
            };

            // Then, it should not throw the exception. Indeed, that's actually
            // impossible since the exception has been wrapped inside a promise
            // and thus swallowed.
            expect(code).not.toThrow();

            // Wait till the async function has finished.
            await flushMicrotasksQueue();

            // Then, it should log the thrown exception.
            // @note For some reason, `expect(spy).toHaveBeenCalledWith(myError);`
            //     did not work, even when passed by reference.
            const consoleErrorInput = spy.mock.calls[0][0];
            expect(consoleErrorInput).toBeInstanceOf(Error);
            expect(consoleErrorInput.message).toBe('random error 1');

            // Remove the console.error spy.
            spy.mockRestore();
        });

        it('should ensure the optional errorHandler parameter is a function when defined', () => {
            // When we call unswallow with a bad error handler (which is not a
            // function).
            const code = () => {
                // $flow-disable-line
                unswallow(async () => { }, 'myErrorHandler-notafunction');
            };

            // Then it should throw.
            expect(code).toThrow();
        });
        
        it('should wrap its asynchronous input function with custom error handler function when specified', async () => {
            // Given we have a throwing asynchronous function.
            const myAsyncFunction = async () => { throw new Error('random error 2'); };

            // Given we have a specific error handler.
            const myErrorHandler = jest.fn();

            // When we wrap this sync function with our unswallow helper using
            // our custom error handler.
            const wrappedAsyncFunction = unswallow(myAsyncFunction, myErrorHandler);

            // When we call our wrapped asynchronous function.
            const code = () => {
                wrappedAsyncFunction();
            };

            // Then, it should not throw the exception. Indeed, that's actually
            // impossible since the exception has been wrapped inside a promise
            // and thus swallowed.
            expect(code).not.toThrow();

            // Wait till the async function has finished.
            await flushMicrotasksQueue();

            // Then, it should call our custom error handler with the
            // thrown exception.
            // @note For some reason, `expect(myErrorHandler).toHaveBeenCalledWith(myError);`
            //     did not work, even when passed by reference.
            const myErrorHandlerInput = myErrorHandler.mock.calls[0][0];
            expect(myErrorHandlerInput).toBeInstanceOf(Error);
            expect(myErrorHandlerInput.message).toBe('random error 2');

        });

    });

});