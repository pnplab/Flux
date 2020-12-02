package org.pnplab.stressoncovid19.deprec;

import android.Manifest;
import android.content.Context;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.Looper;
import android.os.SystemClock;

import androidx.core.util.Pair;

import com.intentfilter.androidpermissions.PermissionManager;
import com.intentfilter.androidpermissions.models.DeniedPermissions;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;

import org.pnplab.phenotype.acquisition.Ping;
import org.pnplab.phenotype.acquisition.listeners.Accelerometer;
import org.pnplab.phenotype.acquisition.listeners.BatteryPercentage;
import org.pnplab.phenotype.acquisition.listeners.GPSLocation;
import org.pnplab.phenotype.acquisition.listeners.Pedometer;
import org.pnplab.phenotype.acquisition.listeners.SignificantMotion;
import org.pnplab.phenotype.logger.AbstractLogger;
import org.pnplab.phenotype.synchronization.dataflow.Dispatcher;
import org.pnplab.phenotype.synchronization.remote.RabbitStore;
import org.pnplab.phenotype.synchronization.remote.RabbitChannel;
import org.pnplab.phenotype.synchronization.remote.RabbitConnection;
import org.pnplab.phenotype.synchronization.local.SQLiteStore;
import org.pnplab.phenotype.synchronization.dataflow.WritableStore;
import org.pnplab.phenotype.synchronization.dataflow.WifiStatus;
import org.pnplab.phenotype.system.core.AbstractPhenotypeService;
import org.pnplab.stressoncovid19.PhenotypeInitProvider;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executor;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import io.reactivex.rxjava3.android.schedulers.AndroidSchedulers;
import io.reactivex.rxjava3.annotations.NonNull;
import io.reactivex.rxjava3.core.BackpressureStrategy;
import io.reactivex.rxjava3.core.Flowable;
import io.reactivex.rxjava3.core.Observable;
import io.reactivex.rxjava3.disposables.CompositeDisposable;
import io.reactivex.rxjava3.disposables.Disposable;
import java9.util.Lists;
import java9.util.Optional;

// @todo @note data structures should be defined closest to their destination
//  (should we abstract output data structures from transfer/storage
//  structures, but create convertor between them, such as identity in case
//  struct doesn't change).
public class OldStressPhenotypeService extends AbstractPhenotypeService {

    private final AbstractLogger _log = PhenotypeInitProvider.getLogger();
    private final CompositeDisposable _disposables = new CompositeDisposable();

    /*
    @Remoter
    public interface StressClientAPI extends AbstractPhenotypeService.ClientAPI {

    }

    protected class StressClientImpl extends AbstractPhenotypeService.ClientImpl implements StressClientAPI {

    }
    */

    /* This methods returns our android service API to the service's user
     * (which is likely to be an android activity within the main process)
     * through android IPC binding with AIDL/Remoter.
     */
    /*
    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        _log.t();

        StressClientAPI binderImplementation = new StressClientImpl();
        Binder binder = new StressClientAPI_Stub(binderImplementation);

        return null;
    }
    */



    /**
    * @note dirty just retrieving current executor for dirty code.
    * When the calling thread has a Looper installed (like the UI thread), an instance of ExecuteOnCaller will submit
    * Runnables into the caller thread. Otherwise it will submit the Runnables to the UI thread.
    */
    public static class ExecuteOnCaller implements Executor {

        private static ThreadLocal<Handler> threadLocalHandler = new ThreadLocal<Handler>() {
            @Override
            protected Handler initialValue() {
                Looper looper = Looper.myLooper();
                if (looper == null)
                looper = Looper.getMainLooper();
                return new Handler(looper);
            }
        };

        private final Handler handler = threadLocalHandler.get();

        @Override
        public void execute(Runnable command) {
            handler.post(command);
        }
    }

    // @todo move out
    public static class WifiStatusTimePoint {
        public final long timestamp;
        public final boolean isWifiActive;
        public WifiStatusTimePoint(long timestamp, boolean isWifiActive) {
            this.timestamp = timestamp;
            this.isWifiActive = isWifiActive;
        }
    }

    // inspired by android DefaultThreadFactory.
    // @todo out
    static class HandlerThreadFactory implements ThreadFactory {
        private static final AtomicInteger nextPoolNumber = new AtomicInteger(1);
        private final int currentPoolIndex;
        private final AtomicInteger nextThreadNumber = new AtomicInteger(1);

        public HandlerThreadFactory() {
            currentPoolIndex = nextPoolNumber.getAndIncrement();
        }

        public HandlerThread newThread(String threadName) {
            String fullThreadName = String.format(
                    "%s p:%s t:%s",
                    threadName,
                    currentPoolIndex,
                    nextThreadNumber.getAndIncrement()
            );

            // @note
            // BasicThreadFactory uses Thread.NORM_PRIORITY.
            // The default HandlerThread priority is
            // THREAD_PRIORITY_BACKGROUND which is caped to
            // 10% CPU. This can be modified / increased.
            // cf. https://stackoverflow.com/a/14214799/939741
            //
            // @warning
            // THREAD.* priorities shouldn't be using according to
            // HandlerThread constructor doc, only android.os.Process.*
            // ones!
            int threadPriority = android.os.Process.THREAD_PRIORITY_BACKGROUND;

            HandlerThread handlerThread = new HandlerThread(fullThreadName, threadPriority);

            // Start thread.
            handlerThread.start();

            return handlerThread;
        }

        @Override
        public Thread newThread(Runnable r) {
            HandlerThread thread = newThread("");
            Looper looper = thread.getLooper();
            Handler handler = new Handler(looper);
            handler.post(r);
            return thread;
        }
    }
    // @todo private (used by MyLogger ATM)
    public static final HandlerThreadFactory _handlerThreadFactory = new HandlerThreadFactory();

    // Cache 1 single thread for data transfer from local (sqlite) to remote
    // (rabbitmq),
    // - in order to limit all I/O to one thread, in order prevent over usage
    //   of CPU and I/O ships. We have had issues of phones not being able to
    //   charge due to transfer in dev tests.
    // - as, while retrieving items (disk) can be done asynchronously, sending
    //   them (network) and removing them (disk) should be done sequentially.
    //
    //   @note although this is true in theory for now, in practice, network
    //   transfer and local removal operations can be done asynchronously.
    //   RabbitMQ Network transfer's ack/nack are not verified before removal,
    //   in order to lower the charge on the server in case of issue. This can
    //   induce loss of data, but these are not critical. Missing packets
    //   should still be monitored server side though, in order to ensure the
    //   system gets adapted if we dont retrieve a relevant amount of data.
    HandlerThread _transferHandlerThread = null;
    HandlerThread _dbConnectionThread = null;

    // WritableStore data to network storage or local storage if not available.
    private <T> Disposable _processData(Context context, Flowable<T> dataStream, String tableName, Class<?> dataClass, String primaryKey, String... otherOrderedFields) {
        /* ACQUISITION */

        // connection stream
        @NonNull Observable<Optional<Connection>> rabbitConnectionStream = rabbitCredentialStream
                .switchMap(RabbitConnection::streamAndRetryOnFailure);

        // sensor timestamp sync comments to move.
        // https://issuetracker.google.com/issues/36916900#comment18
        // https://issuetracker.google.com/issues/36972829

        CompositeDisposable disposables = new CompositeDisposable();

        if (_dbConnectionThread == null) {
            // Create connection thread.
            _dbConnectionThread = _handlerThreadFactory.newThread("rabbitmq-connection");

            // Stop thread looper (and thread) on main system dispose.
            Disposable disposeDbConnectionThread = new Disposable() {
                private boolean _isDisposed = false;

                @Override
                public synchronized void dispose() {
                    // Ensure single call to dispose.
                    if (isDisposed()) {
                        throw new IllegalStateException("Thread already disposed");
                    }

                    // Wait looper tasks to be finished and then end looper (and
                    // thread as well). Thus can be safely disposed before other
                    // Disposable.
                    final Looper dbConnectionlooper = _dbConnectionThread.getLooper();
                    dbConnectionlooper.quitSafely();

                    // Track thread state with custom variable, instead of Thread
                    // isInterrupted / isAlive methods as these reflect immediate
                    // state and will only change once thread as effectively
                    // finished processing.
                    _isDisposed = true;

                    // Reset var.
                    _dbConnectionThread = null;
                }

                @Override
                public synchronized boolean isDisposed() {
                    return _isDisposed;
                }
            };
            _disposables.add(disposeDbConnectionThread);
        }
        final Looper dbConnectionlooper = _dbConnectionThread.getLooper();

        // Retrieve local and remote stores to register item into.
        List<String> fieldNames = new ArrayList<>();
        fieldNames.add(primaryKey);
        fieldNames.addAll(Lists.of(otherOrderedFields));
        Observable<Optional<RabbitStore>> rabbitStoreStream = rabbitConnectionStream
                // Generate channel out of connection.
                .switchMap(optionalConnection ->
                    optionalConnection.isPresent()
                        ? RabbitChannel.streamAndRetryOnFailure(optionalConnection.get())
                        : Observable.just(Optional.<Channel>empty())
                )
                // Generate store out of channel.
                .map(optionalChannel ->
                    optionalChannel.isPresent()
                        ? Optional.of(new RabbitStore(optionalChannel.get(), tableName, dataClass, fieldNames.toArray(new String[0])))
                        : Optional.empty()
                );

        Observable<SQLiteStore> sqliteStoreStream = SQLiteStore
                .streamWriter(context, tableName, dataClass, primaryKey, otherOrderedFields);
        Observable<WritableStore> storeStream = Dispatcher
                .streamRemoteOrLocalFallbackStore(
                        context,
                        _log,
                        rabbitStoreStream,
                        sqliteStoreStream
                );

        // Create a thread,
        // - as an handler thread, such as it contains an Android looper and
        //   thus methods such as SensorManager#registerListener can be used
        //   with it (ie. from stream generation).
        // - instead of main thread, in order to prevent NetworkOnMainThread
        //   exceptions and provide parallel processing for slow I/O and
        //   processing tasks.
        HandlerThread handlerThread = _handlerThreadFactory.newThread(tableName);
        final Looper looper = handlerThread.getLooper();
        // Stop thread looper (and thread) on main system dispose.
        Disposable disposeThread = new Disposable() {
            private boolean _isDisposed = false;

            @Override
            public synchronized void dispose() {
                // Wait looper tasks to be finished and then end looper (and
                // thread as well). Thus can be safely disposed before other
                // Disposable.
                handlerThread.quitSafely();
                // Track thread state with custom variable, instead of Thread
                // isInterrupted / isAlive methods as these reflect immediate
                // state and will only change once thread as effectively
                // finished processing.
                _isDisposed = true;
            }

            @Override
            public synchronized boolean isDisposed() {
                return _isDisposed;
            }
        };
        _disposables.add(disposeThread);

        // Bind gps data to the stores.
        Flowable<Pair<T, WritableStore>> dataStorageBinding = Dispatcher
                .pairDataAndStoreStreams(
                        dataStream
                            // Run data generation, I/O, processing on a single, data-type
                            // specific thread, in order to:
                            // - prevent a specific data type processing/i/o to
                            //   significantly slow down the other ones (to the point of
                            //   losing items), by blocking the thread.
                            // - have data i/o and processing for the same data type on the
                            //   same thread
                            //   a. such as back-pressure occurs naturally (slower
                            //   processing slows down input/output -- optional as rxjava
                            //   handle this otherwise).
                            //   b. such as inter-thread communication (locking, ...) is
                            //   minimized (optional, as locking is quite fast nonetheless,
                            //   providing it's not long).
                            //   @warning 2 different threads are better than this if both
                            //   i/o and processing takes significant processing time.
                            .subscribeOn(AndroidSchedulers.from(looper)),
                        storeStream
                            .subscribeOn(AndroidSchedulers.from(dbConnectionlooper))
                );

        // WritableStore data.
        Disposable subscription = dataStorageBinding
                .subscribe(p -> {
                    final T data = p.first;
                    WritableStore store = p.second;
                    assert(store != null);

                    try {
                        store.write(data);
                    }
                    // Fallback to sqlite in case of error.
                    catch (Exception exc) {
                        if (!(store instanceof SQLiteStore)) {
                            _log.e("caught exception while writing data, falling back to sqlite.");
                            _log.exc(exc);

                            // Open local db if necessary.
                            //
                            // @warning
                            // Db opening can be quite slow especially
                            // since remote store was used before (thus
                            // sqlite was closed), although standard stream
                            // should fall back to sqlite connection soon
                            // so spikes will happen only on edge cases.
                            //
                            // @warning
                            // This can provoke cpu spike at disconnection
                            // though.
                            //
                            // @todo Test cpu spike on both server
                            //    disconnection and wifi off when large db
                            //    + lot of sensors going on. Adjust durable
                            //    connection handle in these case (use more
                            //    memory, but perhaps less cpu/battery for
                            //    disco/recon so might be of interest).
                            sqliteStoreStream
                                    .subscribeOn(AndroidSchedulers.from(looper))
                                    .firstOrError() // auto dispose connection after write if none is listening anymore.
                                    .subscribe(sqliteStore -> {
                                        // Write data.
                                        try {
                                            sqliteStore.write(data);
                                        }
                                        catch (Exception exc2) {
                                            _log.e("sqlite refused to write.");
                                            _log.exc(exc2);
                                        }
                                    }, _log::exc);
                        }

                        // Ignore disconnection exception, as it's something we
                        // couldn't have predicted upfront but we've provided
                        // a fallback to anyway. Log other exceptions
                        if (exc.getCause() != null && (exc.getCause() instanceof java.net.SocketException)) {
                            // ...do not log exception if rabbitmq connection failed.
                        }
                        else {
                            _log.exc(exc);
                        }
                    }
                }, err -> {
                    _log.e("acquisition subscription exception");
                    _log.exc(err);
                });

        // WritableStore disposable to clear subscriptions/listeners/... once requested.
        disposables.add(subscription);

        /* TRANSFER - FLUSHING FROM LOCAL */
        // Generate a single thread of data transfer (local to network) if it
        // does not exist. See specific attribute comments for motives.
        if (_transferHandlerThread == null) {
            _transferHandlerThread = _handlerThreadFactory.newThread("data-transfer");
            // Stop thread looper (and thread) on main system dispose.
            Disposable disposeTransferThread = new Disposable() {
                private boolean _isDisposed = false;

                @Override
                public synchronized void dispose() {
                    // Wait looper tasks to be finished and then end looper (and
                    // thread as well). Thus can be safely disposed before other
                    // Disposable.
                    Looper transferThreadLooper = _transferHandlerThread.getLooper();
                    transferThreadLooper.quitSafely();
                    // Track thread state with custom variable, instead of Thread
                    // isInterrupted / isAlive methods as these reflect immediate
                    // state and will only change once thread as effectively
                    // finished processing.
                    _isDisposed = true;
                    _transferHandlerThread = null;
                }

                @Override
                public synchronized boolean isDisposed() {
                    return _isDisposed;
                }
            };
            _disposables.add(disposeTransferThread);
        }
        Looper transferThreadLooper = _transferHandlerThread.getLooper();

        // Create another rabbit store stream for transfer (with thus different
        // rabbitmq channel, for thread-safetiness).
        Observable<Optional<RabbitStore>> rabbitStoreStream2 = rabbitConnectionStream
                // Generate channel out of connection.
                .switchMap(optionalConnection ->
                    optionalConnection.isPresent()
                        ? RabbitChannel.streamAndRetryOnFailure(optionalConnection.get())
                        : Observable.just(Optional.<Channel>empty())
                )
                // Generate store out of channel.
                .map(optionalChannel ->
                    optionalChannel.isPresent()
                        ? Optional.of(new RabbitStore(optionalChannel.get(), tableName, dataClass, fieldNames.toArray(new String[0])))
                        : Optional.empty()
                );

        Disposable transfer = WifiStatus
                .stream(context, _log)
                .subscribeOn(AndroidSchedulers.from(dbConnectionlooper))
                .switchMap(isWifiActive -> {
                    if (!isWifiActive) {
                        return Observable.never();
                    }
                    else {
                        return rabbitStoreStream2
                            .subscribeOn(
                                AndroidSchedulers.from(dbConnectionlooper)
                            );
                    }
                })
                // Pause stream if remote connection has failed / is failing.
                .switchMap(optionalRemoteStore -> {
                    if (optionalRemoteStore.isEmpty()) {
                        return Observable.never();
                    } else {
                        return Observable.just(optionalRemoteStore.get());
                    }
                })
                // Inject local store if remote connection is established.
                .withLatestFrom(sqliteStoreStream.subscribeOn(AndroidSchedulers.from(dbConnectionlooper)), Pair::create)
                .observeOn(AndroidSchedulers.from(transferThreadLooper))
                .toFlowable(BackpressureStrategy.LATEST)
                .<Pair<Pair<RabbitStore, SQLiteStore>, T>>flatMap(stores -> {
                    SQLiteStore<T> localStore = stores.second;
                    assert(localStore != null);

                    // Read data on request.
                    return Flowable.generate(generator -> {
                        try {
                            assert localStore != null;
                            final T data = localStore.read();
                            if (data == null) {
                                // ...do nothing if there is no data.
                            }
                            else {
                                generator.onNext(Pair.create(stores, data));
                            }
                        }
                        catch (Exception e) {
                            generator.onError(e);
                        }
                    });
                })
                // Transfer data.
                .subscribe(tuple -> {
                    Pair<RabbitStore, SQLiteStore> stores = tuple.first;
                    assert stores != null;
                    RabbitStore remoteStore = stores.first;
                    SQLiteStore localStore = stores.second;
                    assert localStore != null;
                    assert remoteStore != null;
                    T data = tuple.second;

                    try {
                        remoteStore.write(data);
                        localStore.remove(data);
                    }
                    catch (Exception exc) {
                        _log.e("transfer exception");
                        _log.exc(exc);
                    }
                },
                e -> {
                    _log.e("transfer subscription exception");
                    _log.exc(e);
                });

        // WritableStore disposable to clear subscriptions/listeners/... once requested.
        disposables.add(transfer);

        // Return disposables.
        return disposables;
    }

    @Override
    protected void _onBackgroundModeStarted() {
        Context context = getApplicationContext();
        SensorManager sensorManager = (SensorManager) context.getSystemService(SENSOR_SERVICE);

        // Check sensor manager is not null. Should never happen has this only
        // happen to certain excluded service manager in the context of an
        // instant launch. Note the sensor manager is not part of this list.
        if (sensorManager == null) {
            throw new IllegalStateException("Android Sensor Manager couldn't be retrieved from context.");
        }

        @NonNull Observable<Boolean> permissionStream = Observable
                // Wrap permission request + response into rx observable.
                .<Boolean>create(emitter -> {
                    // Retrieve permission manager.
                    final PermissionManager permissionManager = PermissionManager
                            .getInstance(context);

                    // Handle ACCESS_FINE_LOCATION permission request.
                    List<String> requestedPermissions = new ArrayList<>();
                    requestedPermissions.add(Manifest.permission.ACCESS_FINE_LOCATION);
                    requestedPermissions.add(Manifest.permission.ACCESS_COARSE_LOCATION);

                    // Handle ACCESS_BACKGROUND_LOCATION
                    // permission request if android version
                    // >= 29 (android 10/Q).
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        requestedPermissions.add(Manifest.permission.ACCESS_BACKGROUND_LOCATION);
                    }

                    // Forward permission callbacks to emitter.
                    PermissionManager.PermissionRequestListener permissionListener = new PermissionManager.PermissionRequestListener() {
                        @Override
                        public void onPermissionGranted() {
                            // Forward permission has been granted.
                            if (!emitter.isDisposed()) {
                                emitter.onNext(true);
                            }
                        }

                        @Override
                        public void onPermissionDenied(DeniedPermissions deniedPermissions) {
                            // Forward permission has been denied .
                            if (!emitter.isDisposed()) {
                                emitter.onError(new IllegalAccessException("ACCESS_FINE_LOCATION or/and ACCESS_BACKGROUND_LOCATION(API29+) permission have been refused"));
                            }
                            // for (DeniedPermission deniedPermission : deniedPermissions) {
                            //     if (deniedPermission.shouldShowRationale()) {
                            //         // Display a rationale about why this permission is required
                            //     }
                            // }
                        }
                    };

                    // Request permission (through notification + hidden activity).
                    permissionManager.checkPermissions(requestedPermissions, permissionListener);
                });

        // WritableStore ping.
        {
            // Retrieve ping stream.
            Flowable<Ping.PingTimePoint> pingStream = Ping
                    .stream();

            // OBSERVE_ON!
            Disposable pingSubscription = this._processData(context, pingStream,
                    "ping", Ping.PingTimePoint.class,
                    "currentTimeMs", "elapsedTimeMs", "uptimeMs"
            );

            // WritableStore disposable to clear subscriptions/listeners/... once requested.
            _disposables.add(pingSubscription);
        }

        // WritableStore GPS location change.
        {
            // @warning observable thread requires looper.
            Flowable<GPSLocation.GPSTimePoint> gpsStream = GPSLocation
                    .stream(context)
                    .onErrorResumeNext(exc -> {
                        // Filter exception unrelated to ACCESS_FINE_LOCATION access.
                        if (!(exc instanceof IllegalAccessException)) {
                            return Flowable.error(exc);
                        }
                        if (exc.getMessage() == null) {
                            return Flowable.error(exc);
                        }
                        if (!exc.getMessage().equals("ACCESS_FINE_LOCATION permission is not granted") && !exc.getMessage().equals("ACCESS_BACKGROUND_LOCATION permission is not granted")) {
                            return Flowable.error(exc);
                        }

                        // Return GPS data stream once permission has been
                        // granted (if ever).
                        return permissionStream
                                // Convert observable to LATEST
                                // backpressure-strategy flowable so we are
                                // able to return flowable stream for gps data
                                // on next operator while always keeping last
                                // permission result.
                                .toFlowable(BackpressureStrategy.LATEST)
                                // Return gps stream if permission has neen granted
                                .switchMap(hasPermissionBeenGranted -> {
                                    if (hasPermissionBeenGranted) {
                                        return GPSLocation
                                                .stream(context);
                                    }
                                    else {
                                        return Flowable
                                                .<GPSLocation.GPSTimePoint>never();
                                    }
                                });
                    })
                    // Convert relative nano timestamp since boot timestamp to
                    // absolute nanosecond timestamp (with bias).
                    .map(gpsTimePoint ->
                            new GPSLocation.GPSTimePoint(
                                // @note System.nanoTime() can't be used as it's some hardware clock time (not GMT).
                                // @warning @todo check for long type overflow (nanosecond precision)!!
                                // @warning @todo split time data has user can change datatime
                                TimeUnit.MILLISECONDS.toNanos(System.currentTimeMillis()) - SystemClock.elapsedRealtimeNanos() + gpsTimePoint.timestamp,

                                gpsTimePoint.accuracy,
                                gpsTimePoint.latitude,
                                gpsTimePoint.longitude,
                                gpsTimePoint.altitude,
                                gpsTimePoint.bearing,
                                gpsTimePoint.speed
                            )
                    );

            // OBSERVE_ON!
            Disposable gpsSubscription = this._processData(context, gpsStream,
                    "gps", GPSLocation.GPSTimePoint.class,
                    "timestamp", "accuracy", "latitude", "longitude", "altitude", "bearing", "speed"
            );

            // WritableStore disposable to clear subscriptions/listeners/... once requested.
            _disposables.add(gpsSubscription);
        }

        // WritableStore wifi status change.
        {
            // Retrieve wifi status stream.
            Flowable<WifiStatusTimePoint> wifiStatusStream = WifiStatus
                    .stream(context, _log)
                    .map(isWifiActive ->
                            new WifiStatusTimePoint(
                                System.currentTimeMillis(),
                                isWifiActive
                            )
                    )
                    .toFlowable(BackpressureStrategy.BUFFER);

            // SUBSCRIBE_ON ??
            Disposable wifiStatusSubscription = this._processData(context, wifiStatusStream,
                    "wifi_status", WifiStatusTimePoint.class,
                    "timestamp", "isWifiActive"
            );

            // WritableStore disposable to clear subscriptions/listeners/... once requested.
            _disposables.add(wifiStatusSubscription);
        }

        // WritableStore accelerometer data.
        {
            Flowable<Accelerometer.AccelerometerTimePoint> accelerometerStream = Accelerometer
                    .stream(context, _log)
                    .filter(evt -> evt instanceof Accelerometer.AccelerometerTimePoint)
                    .map(accelerometerEvent -> {
                        Accelerometer.AccelerometerTimePoint accelerometerTimePoint = (Accelerometer.AccelerometerTimePoint) accelerometerEvent;
                        return new Accelerometer.AccelerometerTimePoint(
                                // @note System.nanoTime() can't be used as it's some hardware clock time (not GMT).
                                // @warning @todo check for long type overflow (nanosecond precision)!!
                                // @warning @todo split time data has user can change datatime
                                TimeUnit.MILLISECONDS.toNanos(System.currentTimeMillis()) - SystemClock.elapsedRealtimeNanos() + accelerometerTimePoint.timestamp,
                                accelerometerTimePoint.accuracy,
                                accelerometerTimePoint.x,
                                accelerometerTimePoint.y,
                                accelerometerTimePoint.z
                        );
                    });

            Disposable accelerometerSubscription = this._processData(context, accelerometerStream,
                    "accelerometer", Accelerometer.AccelerometerTimePoint.class,
                    "timestamp", "accuracy", "x", "y", "z"
            );

            // WritableStore disposable to clear subscriptions/listeners/... once requested.
            _disposables.add(accelerometerSubscription);
        }

        {
            // @warning prevent phone from charging !
            Flowable<BatteryPercentage.BatteryPercentageTimePoint> batteryPercentageStream = Flowable
                    .interval(0, 5, TimeUnit.MINUTES)
                    .map((count) -> BatteryPercentage.get(context, _log));

            Disposable batteryPercentageSubscription = this._processData(context, batteryPercentageStream,
                    "battery_percentage", BatteryPercentage.BatteryPercentageTimePoint.class,
                    "timestamp", "batteryPercentage"
            );

            // WritableStore disposable to clear subscriptions/listeners/... once requested.
            _disposables.add(batteryPercentageSubscription);
        }

        {
            // Retrieve significant motion stream.
            Flowable<SignificantMotion.SignificantMotionTimePoint> significantMotionStream = SignificantMotion
                    .stream(context, _log)
                    // Convert relative nano timestamp since boot timestamp to
                    // absolute nanosecond timestamp (with bias).
                    .map(significantMotionTimePoint ->
                            new SignificantMotion.SignificantMotionTimePoint(
                                // @note System.nanoTime() can't be used as it's some hardware clock time (not GMT).
                                // @warning @todo split time data has user can change datatime
                                TimeUnit.MILLISECONDS.toNanos(System.currentTimeMillis()) - SystemClock.elapsedRealtimeNanos() + significantMotionTimePoint.timestamp
                            )
                    );

            Disposable significantMotionSubscription = this._processData(context, significantMotionStream,
                    "significant_motion", SignificantMotion.SignificantMotionTimePoint.class,
                    "timestamp"
            );

            // WritableStore disposable to clear subscriptions/listeners/... once requested.
            _disposables.add(significantMotionSubscription);
        }

        {
            // Retrieve pedometer stream.
            Flowable<Pedometer.PedometerDataPoint> pedometerStream = Pedometer
                    .stream(sensorManager, _log)
                    // Convert relative nano timestamp since boot timestamp to
                    // absolute nanosecond timestamp (with bias).
                    .map(pedometerTimePoint ->
                            new Pedometer.PedometerDataPoint(
                                // @note System.nanoTime() can't be used as it's some hardware clock time (not GMT).
                                // @warning @todo split time data has user can change datatime
                                TimeUnit.MILLISECONDS.toNanos(System.currentTimeMillis()) - SystemClock.elapsedRealtimeNanos() + pedometerTimePoint.timestamp,
                                pedometerTimePoint.count
                            )
                    );

            // OBSERVE_ON!
            Disposable pedometerSubscription = this._processData(context, pedometerStream,
                    "pedometer", Pedometer.PedometerDataPoint.class,
                    "timestamp", "count"
            );

            // WritableStore disposable to clear subscriptions/listeners/... once requested.
            _disposables.add(pedometerSubscription);
        }

        /*
        // Transfer log stream.
        {
            // Create connection thread.
            if (_dbConnectionThread == null) {
                _dbConnectionThread = _handlerThreadFactory.newThread("rabbitmq-connection");

                // Stop thread looper (and thread) on main system dispose.
                Disposable disposeDbConnectionThread = new Disposable() {
                    private boolean _isDisposed = false;

                    @Override
                    public synchronized void dispose() {
                        // Wait looper tasks to be finished and then end looper (and
                        // thread as well). Thus can be safely disposed before other
                        // Disposable.
                        final Looper dbConnectionlooper = _dbConnectionThread.getLooper();
                        dbConnectionlooper.quitSafely();

                        // Track thread state with custom variable, instead of Thread
                        // isInterrupted / isAlive methods as these reflect immediate
                        // state and will only change once thread as effectively
                        // finished processing.
                        _isDisposed = true;

                        // Reset var.
                        _dbConnectionThread = null;
                    }

                    @Override
                    public synchronized boolean isDisposed() {
                        return _isDisposed;
                    }
                };
                _disposables.add(disposeDbConnectionThread);
            }
            final Looper dbConnectionLooper = _dbConnectionThread.getLooper();
            Disposable transfer = WifiStatus
                    .stream(context, _log)
                    .subscribeOn(AndroidSchedulers.from(dbConnectionLooper))
                    // Stream remote store connection when wifi is active.
                    .switchMap(isWifiActive -> {
                        if (!isWifiActive) {
                            return Observable.never();
                        } else {
                            return rabbitStoreStream
                                    .subscribeOn(AndroidSchedulers.from(dbConnectionLooper));
                        }
                    })
                    // Pause stream if remote connection has failed / is failing.
                    .switchMap(optionalRemoteStore -> {
                        if (optionalRemoteStore.isEmpty()) {
                            return Observable.never();
                        } else {
                            return Observable.just(optionalRemoteStore.get());
                        }
                    })
                    // Inject local store if remote connection is established.
                    .withLatestFrom(sqliteStoreStream, Pair::create)
                    .observeOn(AndroidSchedulers.from(_looper))
                    .toFlowable(BackpressureStrategy.LATEST)
                    .<Pair<Pair<RabbitStore, SQLiteStore>, T>>flatMap(stores -> {
                        SQLiteStore<T> localStore = stores.second;
                        assert(localStore != null);

                        // Read data on request.
                        return Flowable.generate(generator -> {
                            try {
                                assert localStore != null;
                                final T data = localStore.read();
                                if (data == null) {
                                    // ...do nothing if there is no data.
                                }
                                else {
                                    generator.onNext(Pair.create(stores, data));
                                }
                            }
                            catch (Exception e) {
                                generator.onError(e);
                            }
                        });
                    })
                    // Transfer data.
                    .subscribe(tuple -> {
                        Pair<RabbitStore, SQLiteStore> stores = tuple.first;
                        assert stores != null;
                        RabbitStore remoteStore = stores.first;
                        SQLiteStore localStore = stores.second;
                        assert localStore != null;
                        assert remoteStore != null;
                        T data = tuple.second;

                        try {
                            remoteStore.write(data);
                            localStore.remove(data);
                        }
                        catch (Exception exc) {
                        }
                    });

            // WritableStore disposable to clear subscriptions/listeners/... once requested.
            disposables.add(transfer);
        }
        */
    }

    @Override
    protected void _onBackgroundModeStopped() {
        _disposables.clear();
    }
}
