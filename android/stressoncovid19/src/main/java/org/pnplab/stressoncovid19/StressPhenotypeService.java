package org.pnplab.stressoncovid19;

import android.content.Context;
import android.hardware.SensorManager;
import android.os.Handler;
import android.os.Looper;

import androidx.core.util.Pair;

import org.pnplab.phenotype.acquisition.Ping;
import org.pnplab.phenotype.acquisition.listeners.Pedometer;
import org.pnplab.phenotype.logger.AbstractLogger;
import org.pnplab.phenotype.synchronization.Dispatcher;
import org.pnplab.phenotype.synchronization.RabbitStore;
import org.pnplab.phenotype.synchronization.SQLiteStore;
import org.pnplab.phenotype.synchronization.Store;
import org.pnplab.phenotype.synchronization.WifiStatus;
import org.pnplab.phenotype.system.entrypoints.AbstractPhenotypeInitProvider;
import org.pnplab.phenotype.system.entrypoints.AbstractPhenotypeService;

import java.util.concurrent.Executor;

import io.reactivex.rxjava3.annotations.NonNull;
import io.reactivex.rxjava3.core.BackpressureStrategy;
import io.reactivex.rxjava3.core.Flowable;
import io.reactivex.rxjava3.core.Observable;
import io.reactivex.rxjava3.disposables.CompositeDisposable;
import io.reactivex.rxjava3.disposables.Disposable;
import io.reactivex.rxjava3.schedulers.Schedulers;
import java9.util.Optional;

public class StressPhenotypeService extends AbstractPhenotypeService {

    private final AbstractLogger _log = AbstractPhenotypeInitProvider.getLogger();
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

    @Override
    protected void _onBackgroundModeStarted() {
        // @todo handle missing ACK if server fails !

        Context context = getApplicationContext();
        SensorManager sensorManager = (SensorManager) context.getSystemService(SENSOR_SERVICE);

        // Check sensor manager is not null. Should never happen has this only
        // happen to certain excluded service manager in the context of an
        // instant launch. Note the sensor manager is not part of this list.
        if (sensorManager == null) {
            throw new IllegalStateException("Android Sensor Manager couldn't be retrieved from context.");
        }

        // Store wifi status change.
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

            // Retrieve store to register item into.
            String tableName = "WifiStatus";
            Class<?> tableClass = WifiStatusTimePoint.class;
            Observable<Optional<RabbitStore>> rabbitStoreStream = RabbitStore
                    .streamStoreAndRetryOnFailure(tableName, tableClass, "timestamp", "isWifiActive");
            Observable<SQLiteStore> sqliteStoreStream = SQLiteStore.streamWriter(context, tableName, tableClass, "timestamp", "isWifiActive");
            Observable<Store> storeStream = Dispatcher
                    .streamRemoteOrLocalFallbackStore(
                            context,
                            _log,
                            rabbitStoreStream,
                            sqliteStoreStream
                    );

            // Bind pedometer data to its store.
            Flowable<Pair<WifiStatusTimePoint, Store>> wifiStatusBoundDataStorage = Dispatcher
                    .pairDataAndStoreStreams(
                            wifiStatusStream,
                            storeStream
                    );

            // Store datastream.
            @NonNull Disposable wifiStatusSubscription = wifiStatusBoundDataStorage
                    .observeOn(Schedulers.io()) // Schedulers.from(new ExecuteOnCaller())) // @note subscribeOn contaminate observation! (Registering a sensor requires an Android Looper on the running thread.)
                    // .subscribeOn(Schedulers.io()) // @note FIXES network on main thread.
                    .subscribe(p -> {
                        WifiStatusTimePoint data = p.first;
                        Store store = p.second;

                        try {
                            if (store instanceof RabbitStore) {
                                _log.d("isWifiActive.rstore: " + store.getClass().toString() + " <- " + data.timestamp + ": " + data.isWifiActive);
                            }
                            else if (store instanceof SQLiteStore) {
                                _log.d("isWifiActive.sstore: " + store.getClass().toString() + " <- " + data.timestamp + ": " + data.isWifiActive);
                            }
                            store.write(data);
                        }
                        // Fallback to sqlite in case of error.
                        catch (Exception exc) {
                            _log.exc(exc);

                            _log.d("isWifiActive.sfstore: " + store.getClass().toString() + " <- " + data.timestamp + ": " + data.isWifiActive);

                            // Open local db if necessary.
                            //
                            // @warning
                            // Db opening can be quite slow especially
                            // since connection was used before (thus
                            // sqlite was closed), although standard stream
                            // should be falling back to sqlite connection
                            // soon so this will happen only on edge cases.
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
                                .observeOn(Schedulers.io())
                                .firstOrError() // auto dispose connection after write if none is listening anymore.
                                .subscribe(sqliteStore -> {
                                    // Write data.
                                    sqliteStore.write(data);
                                }, _log::exc);
                        }
                    }, err -> {
                        _log.e("isWifiActive.error: " + err.toString());
                        _log.exc(err);
                    });

            // Store disposable to clear subscriptions/listeners/... once requested.
            _disposables.add(wifiStatusSubscription);
        }

        {
            // Retrieve pedometer stream.
            Flowable<Pedometer.PedometerDataPoint> pedometerStream = Pedometer.stream(sensorManager, _log);

            // Retrieve store to register item into.
            String tableName = "pedometer";
            Class<?> tableClass = Pedometer.PedometerDataPoint.class;
            Observable<Optional<RabbitStore>> rabbitStoreStream = RabbitStore.streamStoreAndRetryOnFailure(tableName, tableClass, "timestamp", "count");
            Observable<SQLiteStore> sqliteStoreStream = SQLiteStore
                    .streamWriter(context, tableName, tableClass, "timestamp", "count")
                    .subscribeOn(Schedulers.io()); // subscribe on io thread as opening db might take time / block thread.
            Observable<Store> storeStream = Dispatcher
                    .streamRemoteOrLocalFallbackStore(
                            context,
                            _log,
                            rabbitStoreStream,
                            sqliteStoreStream
                    );

            // Bind pedometer data to its store.
            Flowable<Pair<Pedometer.PedometerDataPoint, Store>> pedometerBoundDataStorage = Dispatcher
                    .pairDataAndStoreStreams(
                            pedometerStream,
                            storeStream
                    );

            // Store datastream.
            @NonNull Disposable pedometerSubscription = pedometerBoundDataStorage
                    .observeOn(Schedulers.io()) // Schedulers.from(new ExecuteOnCaller())) // @note subscribeOn contaminate observation! (Registering a sensor requires an Android Looper on the running thread.)
                    // .subscribeOn(Schedulers.io()) // @note FIXES network on main thread.
                    .subscribe(p -> {
                        Pedometer.PedometerDataPoint data = p.first;
                        Store store = p.second;

                        try {
                            _log.d("subs.dstore: " + store.getClass().toString() + " <- " + data.timestamp + ": " + data.count);
                            store.write(data);
                        }
                        // Fallback to sqlite in case of error.
                        catch (Exception exc) {
                            _log.exc(exc);

                            _log.d("subs.sstore: " + store.getClass().toString() + " <- " + data.timestamp + ": " + data.count);

                            // Open local db if necessary.
                            //
                            // @warning
                            // Db opening can be quite slow especially
                            // since connection was used before (thus
                            // sqlite was closed), although standard stream
                            // should be falling back to sqlite connection
                            // soon so this will happen only on edge cases.
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
                                .observeOn(Schedulers.io())
                                .firstOrError() // auto dispose connection after write if none is listening anymore.
                                .subscribe(sqliteStore -> {
                                    // Write data.
                                    sqliteStore.write(data);
                                }, _log::exc);
                        }
                    }, err -> {
                        _log.e("subs.error: " + err.toString());
                        _log.exc(err);
                    });

            // Store disposable to clear subscriptions/listeners/... once requested.
            _disposables.add(pedometerSubscription);
        }

        {
            // Retrieve ping stream.
            Flowable<Ping.PingTimePoint> pingStream = Ping.stream();
            // @todo @warning exp. backoff not working !

            // Retrieve store to register item into.
            String tableName = "ping";
            Class<?> tableClass = Ping.PingTimePoint.class;
            Observable<Optional<RabbitStore>> rabbitStoreStream = RabbitStore.streamStoreAndRetryOnFailure(tableName, tableClass, "time");
            Observable<SQLiteStore> sqliteStoreStream = SQLiteStore.streamWriter(context, tableName, tableClass, "time");
            Observable<Store> storeStream = Dispatcher
                    .streamRemoteOrLocalFallbackStore(
                            context,
                            _log,
                            rabbitStoreStream,
                            sqliteStoreStream
                    );

            // Bind pedometer data to its store.
            Flowable<Pair<Ping.PingTimePoint, Store>> pingBoundDataStorage = Dispatcher
                    .pairDataAndStoreStreams(
                            pingStream,
                            storeStream
                    );

            // Store datastream.
            @NonNull Disposable pingSubscription = pingBoundDataStorage
                    .observeOn(Schedulers.io()) // Schedulers.from(new ExecuteOnCaller())) // @note subscribeOn contaminate observation! (Registering a sensor requires an Android Looper on the running thread.)
                    // .subscribeOn(Schedulers.io()) // @note FIXES network on main thread.
                    .subscribe(p -> {
                        Ping.PingTimePoint data = p.first;
                        Store store = p.second;

                        try {
                            // _log.d("subs.dstore: " + store.getClass().toString() + " <- " + data.time);
                            store.write(data);
                        }
                        // Fallback to sqlite in case of error.
                        catch (Exception exc) {
                            _log.exc(exc);

                            // _log.d("subs.sstore: " + store.getClass().toString() + " <- " + data.time);
                            if (!(store instanceof SQLiteStore)) {
                                _log.e("caught exception while writing data, falling back to sqlite.");

                                // Open local db if necessary.
                                //
                                // @warning
                                // Db opening can be quite slow especially
                                // since connection was used before (thus
                                // sqlite was closed), although standard stream
                                // should be falling back to sqlite connection
                                // soon so this will happen only on edge cases.
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
                                    .observeOn(Schedulers.io())
                                    .firstOrError() // auto dispose connection after write if none is listening anymore.
                                    .subscribe(sqliteStore -> {
                                        // Write data.
                                        sqliteStore.write(data);
                                    }, _log::exc);
                            }
                        }
                    }, err -> {
                        // _log.e("subs.error: " + err.toString());
                        _log.exc(err);
                    });

            // Store disposable to clear subscriptions/listeners/... once requested.
            _disposables.add(pingSubscription);
        }

        {
            String tableName = "pedometer";
            Class<?> tableClass = Pedometer.PedometerDataPoint.class;
            Observable<SQLiteStore> sqliteStoreStream = SQLiteStore
                    .streamWriter(context, tableName, tableClass, "timestamp", "count");

            Disposable pedometerTransfer = WifiStatus
                    .stream(context, _log)
                    // .observeOn(Schedulers.io()) // Schedulers.from(new ExecuteOnCaller())) // @note subscribeOn contaminate observation! (Registering a sensor requires an Android Looper on the running thread.)
                    .subscribeOn(Schedulers.io()) // @note FIXES network on main thread.
                    // Stream remote store connection when wifi is active.
                    .switchMap(isWifiActive -> {
                        if (!isWifiActive) {
                            return Observable.empty();
                        } else {
                            return RabbitStore
                                    .streamStoreAndRetryOnFailure(tableName, tableClass, "timestamp", "count");
                        }
                    })
                    // Pause stream if remote connection has failed / is failing.
                    .switchMap(optionalRemoteStore -> {
                        if (optionalRemoteStore.isEmpty()) {
                            return Observable.empty();
                        } else {
                            return Observable.just(optionalRemoteStore.get());
                        }
                    })
                    // Inject local store if remote connection is established.
                    .withLatestFrom(sqliteStoreStream, Pair::create)
                    .toFlowable(BackpressureStrategy.LATEST)
                    .<Pair<Pair<RabbitStore, SQLiteStore>, Pedometer.PedometerDataPoint>>flatMap(stores -> {
                        SQLiteStore<Pedometer.PedometerDataPoint> localStore = stores.second;

                        // Read data on request.
                        return Flowable.generate(generator -> {
                            try {
                                assert localStore != null;
                                Pedometer.PedometerDataPoint data = localStore.read();
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
                        Pedometer.PedometerDataPoint data = tuple.second;

                        remoteStore.write(data);
                        localStore.remove(data);
                    },
                    e -> {
                        _log.exc(e);
                    });

            // Store disposable to clear subscriptions/listeners/... once requested.
            _disposables.add(pedometerTransfer);
        }

    }

    @Override
    protected void _onBackgroundModeStopped() {
        _disposables.clear();
    }

}
