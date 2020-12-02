package org.pnplab.phenotype.api;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.DeadObjectException;
import android.os.IBinder;

import androidx.core.content.ContextCompat;

import org.pnplab.phenotype.BuildConfig;
import org.pnplab.phenotype.core.AbstractService;
import org.pnplab.phenotype.logger.AbstractLogger;
import org.pnplab.phenotype.deprec.entrypoints.ClientAPI_Proxy;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Proxy;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executor;

import java9.util.function.BiConsumer;
import java9.util.function.Consumer;
import java9.util.stream.Stream;
import java9.util.stream.StreamSupport;

/**
 * This class wraps the android logic to bind to the phenotype service
 * service, most likely from an android activity. It handles connection's
 * lifecycle properly and manage most edge cases. It thus can be safely use in
 * any context.
 */
final public class ClientServiceAPI {

    private final Context _context;
    private final AbstractLogger _log;

    public ClientServiceAPI(Context context, AbstractLogger logger) {
        _context = context;
        _log = logger;
    }

    /**
     * Check if the client is already running.
     *
     * @throws UnsupportedOperationException This can't be implemented (see
     *     comments).
     */
    private boolean isServiceRunning() {
        // Check if the service is currently running.
        //
        // @warning
        //
        // We can not use standard approaches for this as our service is in a
        // remote process and other approaches are hacky
        //
        // > All the approaches using onDestroy or onSomething events or
        // > Binders or static variables will not work reliably because as a
        // > developer you never know, when Android decides to kill your process
        // > or which of the mentioned callbacks are called or not. Please note
        // > the "killable" column in the lifecycle events table in the Android
        // > documentation.
        //
        // > Starting Android O, getRunningServices is deprecated.
        //
        // > as of Android O, getRunningServices is no longer available to
        // > third party applications. For backwards compatibility, it will
        // > still return the caller's own services.
        //
        // > -1. getRunningServices method is not really sustainable. It does not work on Android KitKat.
        //
        // cf. https://stackoverflow.com/questions/600207/how-to-check-if-a-service-is-running-on-android/5921190#5921190
        //
        // The only left relevant approach is to ping the service using a
        // broadcast receiver. Thus having two states: Running, Pending. We're
        // left to either,
        // - add a timeout manually to consider it is not running, or,
        // - bind the service it (thus start it, but temporarily), inside the
        //   service flag whether onStart/onStartCommand has been triggered or
        //   not, and add a method to the service interface to check this.

        throw new UnsupportedOperationException("It is not possible to know whether a remote service is running or not without starting it.");
    }

    /**
     * Start the service long-term activation. This is intended to be used when
     * we want the service to be on even after the app closes.
     *
     * @throws UnsupportedOperationException You should use bind API to start
     *     the service.
     */
    public void startService() {
        // Calling service#startBackgroundMode flags the service as stopped.
        // Indeed, this would not be possible to achieve using regular android
        // lifecycle methods. Thus user shall use binding to stop the service
        // instead.
        throw new UnsupportedOperationException("Service should be started through binding in order to keep its state consistent.");
    }

    /**
     * Stop the service long-term activation. Using this method prevents the
     * service from being kept alive after the app closes.
     *
     * Single call to this method should stop the service, except when bindings
     * are alive at the moment. Service bindings keeps the service alive until
     * they are disconnected.
     *
     * @throws UnsupportedOperationException You should use bind API to start
     *     the service.
     */
    public void stopService() {
        // Calling service#stopBackgroundMode flags the service as stopped.
        // Indeed, this would not be possible to achieve using regular android
        // lifecycle methods. Thus user shall use binding to stop the service
        // instead.
        throw new UnsupportedOperationException("Service should be stopped through binding in order to keep its state consistent.");
    }

    /**
     * Binds the service temporarily and provide access to its API on success,
     * trigger error on failure and disconnection. the onSuccess callback
     * provides an unbinding function to be used while the service is still
     * bound (through the onSuccess callback as well).
     *
     * Every callbacks are run asynchronously on UI thread.
     *
     * @warning
     * If you happen to use phenotype.start(onSuccessCallback, onErrorCallback)
     * inside this callback, you should unbind it
     *
     * @warning
     * > You should always trap DeadObjectException exceptions, which are
     * > thrown when the connection has broken. This is the only exception
     * > thrown by remote methods.
     * cf. https://developer.android.com/guide/components/bound-services.html#Additional_Notes
     * Android doc claims are wrong. On top of DeadObjectException, some of the
     * exception in the aidl interface implementation stream sometimes also be
     * forwarded depending on their type.
     * cf. https://blog.classycode.com/dealing-with-exceptions-in-aidl-9ba904c6d63
     * The remoter lib we use for AIDL forwards all exceptions and wrap checked
     * RemoteException/DeadObjectException inside unchecked RuntimeException.
     * User should thus watch out for these RuntimeException instead of
     * DeadObjectException!
     * cf. remoter-generated AIDL stub implementation source code.
     * If this happens, the unbind method can optionally be called by the user,
     * but it's not mandatory as an onError callback will be triggered through
     * a disconnected connection callback soon triggered otherwise.
     *
     * @param onSuccess Callback triggered with the unbind function and the
     *                  aidl interface object. This callback is only ever
     *                  called once at most.
     * @param onError Callback triggered with an RuntimeException error as a
     *                parameter. This callback is only ever called once at
     *                most. This automatically unbinds the service. The
     *                unbing method shall thus never be called after this is
     *                triggered!
     */
    synchronized public void bindService(final BiConsumer<AbstractService.ClientAPI, Runnable> onSuccess, final Consumer<RuntimeException> onError) {
        Context context = _context;

        // Wrap callbacks in order to always queue them to the main thread's
        // looper,
        //
        // - To prevent threading inconsistency, considering otherwise, the
        // thread execution of the callbacks would depends on many condition:
        //   - the kind of callback (onError/onSuccess).
        //   - the thread of the first bind call after last reset (where
        //     bindService was called).
        //   - the thread of the current bind call.
        //   - the current binding state (pending or active).
        //
        // - To ensure asynchronous consistensy, following Promise A+ standard
        // recommandations. Considering otherwise, callback would be executed
        // synchronously sometimes, and asynchronously other times. This could
        // lead to subtle bugs such as unexpected object reference change.
        // cf. https://promisesaplus.com/
        //
        // - To prevent potential rare temporary lockage and ANR on multithreaded
        // code for heavy callbacks, considering callbacks would otherwise be
        // run within our synchronised method.
        //
        // - To potentially improve overall app responsivity, at the cost of
        // callback responsivity, since smaller looper runnable gives the hand
        // back to the other tasks more often.
        //
        // @note getMainExecutor is incompatible with API < 28 so we use
        //     ContextCompat to avoid crashes
        Executor mainExecutor = ContextCompat.getMainExecutor(context);
        BiConsumer<AbstractService.ClientAPI, Runnable> onSuccessOnMainThread = (phenotype, unbind) -> mainExecutor.execute(
                () -> {
                    try {
                        onSuccess.accept(phenotype, unbind);
                    }
                    catch (RuntimeException exc) {
                        // If we got a DeadObjectException/RemoteException...
                        // @note Remoter lib wraps RemoteException as
                        // RuntimeException to make them unchecked.
                        // @warning It's hard to see if getCause will forward
                        // the remote exception or something intermediary!
                        if (exc.getCause() instanceof DeadObjectException) {
                            // ...binding died while the callback was trying to
                            // call a remote service method.
                            // Swallow the exception and do not forward it to
                            // onError as it will already be called through the
                            // died binding callback.
                            // User should catch these himself if he want to
                            // handle them properly. Forwarding this exception
                            // would cause multiple subsequent call to onError.
                            // Although we could trigger unbind as we do for
                            // the other error callbacks to avoid this
                            // scenario, this would neither improve the system
                            // usability nor stability since it will be called
                            // once the disconnected binding callback is
                            // received nonetheless.
                        }
                        // Forward exception otherwise.
                        else {
                            throw exc;
                        }
                    }
                });

        // Consumer<RuntimeException> onErrorOnMainThread = onError;
        Consumer<RuntimeException> onErrorOnMainThread = error -> mainExecutor.execute(() -> onError.accept(error));

        // Start binding the service if it's not already in process.
        if (_bindingState == BindingState.unbound) {
            // Unbound implies callback queue is null. Because in case of
            // unbound state due to disconnection, all onError callbacks
            // should have been triggered and queue should have been
            // flushed.
            assert _callbackList.size() == 0;

            // Retrieve our service or the custom inherited one.
            Class<? extends AbstractService> phenotypeServiceClass = BuildConfig.PHENOTYPE_SERVICE_CLASS;
            Intent intent = new Intent(context, phenotypeServiceClass);

            // Bind to the service.
            // @note isBinding should always be true considering the only
            // constraints doc mentions are programmatic and thus deterministic (
            // in other word, Android OS should always binds successfully if the
            // code is correct). This is a personal interpretation of the
            // doc though.
            // cf. https://developer.android.com/reference/android/content/Context.html#bindService(android.content.Intent,%20android.content.ServiceConnection,%20int)
            //
            // @warning
            // if isBinding is true, then unbindService has to be called.
            //
            // @warning
            // It seems there is no reference counting on bindService. It
            // is not clear whether isBinding return will be true on second
            // call or no.
            // cf. https://stackoverflow.com/questions/28053099/do-i-need-to-perfectly-pair-bindservice-unbindservice-calls
            //
            // > true if the system is in the process of bringing up a service that
            // > your client has permission to bind to; false if the system couldn't
            // > find the service or if your client doesn't have permission to bind
            // > to it. If this value is true, you should later call
            // > unbindService(ServiceConnection) to release the connection.
            // cf. https://developer.android.com/reference/android/content/Context.html#bindService(android.content.Intent,%20android.content.ServiceConnection,%20int)
            //
            // > You usually pair the binding and unbinding during matching
            // > bring-up and tear-down moments of the client's lifecycle, as
            // > described in the following examples
            // cf. https://developer.android.com/guide/components/bound-services.html#Additional_Notes
            //
            // Considering mandatory unbindService call on true return,
            // strict interpretation of the doc implies a reference counting
            // mechanism is in place. While it is explicitly stated that
            // stopService is *not* reference counted, it is not explicitly
            // stated anywhere whether unbindService is or isn't reference
            // counted.
            //
            // Thus we implements reference counting ourselves for safety,
            // and prevent useless calls to bind/unbind.
            boolean isBinding = context.bindService(intent, _serviceConnectionListener, Context.BIND_AUTO_CREATE);
            if (isBinding) {
                _bindingState = BindingState.binding;
            }
        }

        // ...binding may have failed straight away, thus bindingState may
        // still be unbound.

        // Enqueue callbacks for later if relevant, or call them straight away,
        // and return the appropriate unbind function if any.
        switch (_bindingState) {
            // If connection has failed straight away...
            case unbound:
                assert _serviceAidlInterface == null;
                assert _callbackList.size() == 0;

                // do nothing... Do not enqueue any callback as onError will
                // be called right away and unbind should only be called by the
                // user in the context of onSuccess.

                // Directly call onError.
                // might be service perm issues or inexistant service for
                // instance...
                RuntimeException error = new RuntimeException(
                    "Android has refused service connection. " +
                    "The service may not exist or the app " +
                    "has not the permissions required to bind it."
                );
                onErrorOnMainThread.accept(error);

                break;
            // If service was already bound...
            case bound: {
                assert _callbackList.size() >= 1;
                assert _serviceAidlInterface != null;

                // Enqueue onError callback. It might still be called. Also
                // provide the unbind function. No need to provide onSuccess
                // method it will be called straight away.
                ConnectionListenerTuple connectionListenerTuple = new ConnectionListenerTuple();
                connectionListenerTuple.onSuccess = null;
                connectionListenerTuple.onError = onErrorOnMainThread;
                connectionListenerTuple.unbind = () -> _unbind(connectionListenerTuple);

                _callbackList.add(connectionListenerTuple);

                // Directly call onSuccess.
                onSuccessOnMainThread.accept(_serviceAidlInterface, connectionListenerTuple.unbind);

                break;
            }
            // If binding is in progress...
            case binding: {
                // Enqueue every callbacks and unbind function as well.
                ConnectionListenerTuple connectionListenerTuple = new ConnectionListenerTuple();
                connectionListenerTuple.onSuccess = onSuccessOnMainThread;
                connectionListenerTuple.onError = onErrorOnMainThread;
                connectionListenerTuple.unbind = () -> _unbind(connectionListenerTuple);

                _callbackList.add(connectionListenerTuple);

                // ...do nothing. Enqueued callbacks will be triggered later
                // based on binding success/failure.

                // Return the unbind function.
                break;
            }
            default:
                // Should not happen, except if bindingState happen to stream null
                // somehow.
                throw new IllegalStateException("_bindingState value does not exist.");
        }
    }

    // Current binding state, in order to know whether to trigger onSuccess
    // callback directly because service is already bound or to queue it for
    // later because connection is pending.
    private enum BindingState {
        unbound,
        binding,
        bound
    }
    private BindingState _bindingState = BindingState.unbound;

    // Reference to the service Aidl API used while the service is bound.
    private AbstractService.ClientAPI _serviceAidlInterface = null;

    // Queue of tuples of bound callbacks created from the #bind method. Each
    // tuple contains unbind callback, onSuccess and onError listener. Calling
    // the unbind callback removes the listeners and may unbind the service.
    // The effective service unbinding depends on reference counting. Thus
    // the service is only effectively unbound when this queue is empty and no
    // external dependency is considered to rely on the service anymore.
    private class ConnectionListenerTuple  {
        BiConsumer<AbstractService.ClientAPI, Runnable> onSuccess;
        Consumer<RuntimeException> onError;

        // Shall not be called more than once. The unbind method is passed as
        // an argument to the onSuccess callback.
        Runnable unbind;
    }
    private List<ConnectionListenerTuple> _callbackList = new ArrayList<>();

    synchronized private void _setAidlServiceInterface(AbstractService.ClientAPI serviceAidlInterface) {
        // Wrap aidl interface to polyfill android not-working callbacks (which
        // would be failing due to service binder disconnection)..
        AbstractService.ClientAPI proxyInstance = (AbstractService.ClientAPI) Proxy.newProxyInstance(
            AbstractService.ClientAPI.class.getClassLoader(),
            new Class[] { AbstractService.ClientAPI.class },
            (proxy, method, methodArgs) -> {
                // Wrap aidl interface's method with DeadObjectException
                // exception catching as a fallback for service connetion
                // failure because android onServiceDisconnected, onBindingDied
                // callbacks aren't getting called on my phone (android 8).
                try {
                    AbstractService.ClientAPI original = serviceAidlInterface;
                    return method.invoke(original, methodArgs);
                }
                // @note
                // UndeclaredThrowableException automatically wraps java's
                // checked exceptions thrown from method.invoke. These must be
                // caught first through InvocationTargetException in order to
                // unwrap real exception.
                catch (InvocationTargetException exc) {
                    // Unbind service and trigger error callback.
                    if (exc.getCause() instanceof DeadObjectException) {
                        RuntimeException error = new RuntimeException("PhenotypeService service's binding died. Service may have crashed.");
                        _unbindAllAndTriggerError(error);
                    }

                    // Rethrow exception. If we want to swallow it, it shouldn't
                    // be done here since it would prevent the normal code flow
                    // to be interrupted.
                    throw exc.getCause();
                }
            }
        );

        // WritableStore interface
        _serviceAidlInterface = proxyInstance;
    }

    // Unbind function to be curried and called by the user for manual service
    // unbind after connection success.
    synchronized private void _unbind(ConnectionListenerTuple callbackTuple) {
        _log.t();

        Context context = _context;

        // Ensure unbind wasn't already called for this specific set of
        // callback.
        if (!_callbackList.contains(callbackTuple)) {
            throw new IllegalStateException("Current service connection has already been unbound by the user or service got disconnected before.");
        }

        // Remove the callback from the callback list.
        _callbackList.remove(callbackTuple);

        // Unbind service, remove service interface reference, and set binding
        // state to unbound if there is no longer expected references to the
        // service.
        int isBindingRefCount = _callbackList.size();
        if (isBindingRefCount == 0) {
            context.unbindService(_serviceConnectionListener);
            _serviceAidlInterface = null;
            _bindingState = BindingState.unbound;
        }
    }

    // Unbind function called automatically in case of error.
    synchronized private void _unbindAllAndTriggerError(RuntimeException error) {
        Context context = _context;

        // Assert there is at least one binding.
        int isBindingRefCount = _callbackList.size();
        if (isBindingRefCount < 1) {
            throw new IllegalStateException("ClientServiceAPI#unbind should only be called if there is at least one binding ongoing");
        }

        // Clear the callbacks (but keep the onError temporarily so we call
        // them once unbinding has been done).
        // @note _callbackList#forEach java 8 method is not available before
        //     android API 24. We use stream compat instead thus.
        Stream<Consumer<RuntimeException>> onErrorCallbacks = StreamSupport.stream(_callbackList).map(callbackTuple -> callbackTuple.onError);
        _callbackList.clear();

        // Unbind the service.
        // @warning Strict reading of the android doc implies we should pair
        // every previous successful bindService call with corresponding
        // unbindService. Although this probably is a wrong claim, we never
        // happen to encounter the use case since we implement reference
        // counting ourselves. Thus one call to unbindService is enough, since
        // bindService as ever been called only once.
        context.unbindService(_serviceConnectionListener);

        // Reset the connection interface.
        _serviceAidlInterface = null;

        // Reset the binding state.
        _bindingState = BindingState.unbound;

        // Call every onError callbacks.
        onErrorCallbacks.forEach(onError -> onError.accept(error));
    }

    // Android's service bind connection callback listener.
    private ServiceConnection _serviceConnectionListener = new ServiceConnection() {

        // Called when the connection with the service is established.
        public void onServiceConnected(ComponentName className, IBinder service) {
            _log.t();

            _bindingState = BindingState.bound;

            // ...service has bound.

            // WritableStore service interface for later callbacks. We use a method
            // call for thread safety in order to be able to synchronize it.
            ClientAPI_Proxy serviceAidlInterface = new ClientAPI_Proxy(service);
            _setAidlServiceInterface(serviceAidlInterface);

            // Call pending onSuccess callbacks.
            StreamSupport.stream(_callbackList)
                    .filter(callbackTuple -> callbackTuple.onSuccess != null)
                    .forEach(callbackTuple -> {
                        // Trigger onSuccess callback.
                        callbackTuple.onSuccess.accept(_serviceAidlInterface, callbackTuple.unbind);

                        // Remove callback tuple from pending onSuccess
                        // callback list.
                        callbackTuple.onSuccess = null;
                    });
        }

        // Called when the connection with the service disconnects unexpectedly.
        // > This does not remove the ServiceConnection itself -- this binding
        // > to the service will remain active, and you will receive a call to
        // > onServiceConnected(ComponentName, IBinder) when the Service is
        // > next running.
        // cf. https://developer.android.com/reference/android/content/ServiceConnection.html#onBindingDied(android.content.ComponentName)
        public void onServiceDisconnected(ComponentName className) {
            _log.t();

            // ...service has crashed.

            // ...service will be auto restarted if sticky and
            // onServiceConnected called back without needing for rebinding.
            // ...we do not need to restart binding. However we still do in
            // order to keep a consistent behavior with the other type of
            // errors.

            // Unbind service and trigger error callback.
            // RuntimeException error = new RuntimeException("PhenotypeService service has disconnected. Service may have crashed.");
            // _unbindAllAndTriggerError(error);

            // Log the error.
            // We rely on a proxy to catch DeadObjectRemote exceptions from
            // aidl interface instead of this callback as for some reason the
            // callback isn't called on my phone (API 26).
            _log.e("PhenotypeService service has disconnected. Service may have crashed.");
        }

        // > Called when the binding to this connection is dead. This means the
        // > interface will never receive another connection. The application
        // > will need to unbind and rebind the connection to activate it
        // > again. This may happen, for example, *if the application hosting
        // > the service it is bound to has been updated.*
        // cf. https://developer.android.com/reference/android/content/ServiceConnection.html#onBindingDied(android.content.ComponentName)
        //
        // @warning
        // Possibly only called on API 26+
        // And even on API 26, it did not stream called on my API 26 phone after
        // DeadObjectException though (nor any other disconnection-related
        // callback).
        public void onBindingDied(ComponentName name) {
            _log.t();

            // ...we'll need to unbind and rebind.

            // Unbind service and trigger error callback.
            // RuntimeException error = new RuntimeException("PhenotypeService service's binding died. Service's host application may have been updated or uninstalled.");
            // _unbindAllAndTriggerError(error);

            // Log the error.
            // We rely on a proxy to catch DeadObjectRemote exceptions from
            // aidl interface instead of this callback as for some reason the
            // callback isn't called on my phone (API 26).
            _log.e("PhenotypeService service's binding died. Service's host application may have been updated or uninstalled.");
        }

        // This callback is called only when bound service onBind method
        // returns null.
        //
        // @note
        // > Called when the service being bound has returned null from its
        // > onBind() method. This indicates that the attempting service
        // > binding represented by this ServiceConnection will never become
        // > usable.
        //
        // @warning
        // > The app which requested the binding must still call
        // > Context#unbindService(ServiceConnection) to release the tracking
        // > resources associated with this ServiceConnection even if this
        // > callback was invoked following Context#bindService.
        // cf. https://developer.android.com/reference/android/content/ServiceConnection.html#onBindingDied(android.content.ComponentName)
        //
        // @warning possibly only called on API 28+
        public void onNullBinding(ComponentName name) {
            _log.t();

            // ...we'll need to unbind and rebind.

            // Unbind service and trigger error callback.
            // IllegalStateException error = new IllegalStateException("PhenotypeService service's onBind method returned a null pointer.");
            // _unbindAllAndTriggerError(error);

            // Log the error.
            // We rely on a proxy to catch DeadObjectRemote exceptions from
            // aidl interface instead of this callback as for some reason the
            // callback isn't called on my phone (API 26).
            _log.e("PhenotypeService service's onBind method returned a null pointer.");
        }
    };
}
