/**
 * @flow
 */

/**
 * Empty function doing nothing for functional goodness.
 */
export function noop() { }

/**
 * Uncaught exception inside promise and async functions are swallowed and
 * disappear. This helper function has been developed to log these unchaught
 * exception.
 * 
 * It has been developed to wrap async component's callback properties calls,
 * behind the component's interface. Most of the time, these callback
 * properties have been developed to be used synchronously. But when 
 * implemented with the async keyword, the exceptions get swallowed by the
 * promise mechanism, and are never seen. Using unswallow by design ensures
 * the component user is notified of any exception in the log, while
 * maintaining the opportunity of developing a try/catch beforehand (within the
 * callback function).
 * 
 * It is therefore a good practice to call all callbacks with the await 
 * keyword, and use unswallow on their host method, just to be sure any
 * underlying exception would be caught.
 * 
 * @param {(...args?: Array<any>) => Promise<any>} input
 * @param {(err: Error) => void} errorHandler 
 * @returns {Function}
 */
export function unswallow(input: ?(...args?: Array<any>) => any, customErrorHandler?: (err: Error) => void): (...args: Array<any>) => any {
    let errorHandler;

    // Passthrough when input is not a function. This is helpful for instance
    // when processing optional callback properties. `undefined` stays
    // `undefined`.
    if (typeof input !== 'function') {
        return input;
    }

    // Setup custom errorHandler if available.
    if (typeof customErrorHandler !== 'undefined') {
        // Throw if errorHandler has bad argument.
        if (typeof customErrorHandler !== 'function') {
            throw new Error('errorHandler should be a function');
        }
        // Use custom error handler if all's good.
        else {
            errorHandler = customErrorHandler;
        }
    } 
    // Log unchaught error by default if no custom errorHandler.
    else {
        errorHandler = function(err) {
            console.error(err);
        };
    }

    // Return wrapped function (the output may or may not be a promise).
    return (...args) => {
        // Call the input function.
        const returnValue = input(...args);

        // Forward swallowed exception to error handler if any.
        if (returnValue && typeof returnValue.then === 'function') {
            returnValue.catch(errorHandler);
        }
        // Warn error if returnValue is not a Promise. Log the stacktrace as
        // well.
        // else {
        //    const notAPromiseWarning = new Error('Utils#unswallow should not be called with synchronous function. Use try/catch instead.');
        //    console.warn(notAPromiseWarning);
        // }

        // Return function's output.
        return returnValue;
    };
}

/**
 * Helper function type that returns wrapped with Promise.
 * 
 * In this case:
 * $ElementType<PROPS_T, PROP_T> == $Call<typeof unswallow, $ElementType<PROPS_T, PROP_T>>
 */
export type $UnswallowedFn<PROPS_T: Object, PROP_T: string> = $ElementType<PROPS_T, PROP_T>;
