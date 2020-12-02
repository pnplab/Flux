package org.pnplab.stressoncovid19;

import android.content.Context;
import android.hardware.SensorManager;

import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;

import org.pnplab.phenotype.acquisition.Ping;
import org.pnplab.phenotype.acquisition.listeners.Accelerometer;
import org.pnplab.phenotype.acquisition.listeners.BatteryPercentage;
import org.pnplab.phenotype.acquisition.listeners.Pedometer;
import org.pnplab.phenotype.acquisition.listeners.SignificantMotion;
import org.pnplab.phenotype.logger.AbstractLogger;
import org.pnplab.phenotype.synchronization.dataflow.Dispatcher;
import org.pnplab.phenotype.synchronization.dataflow.WifiStatus;
import org.pnplab.phenotype.synchronization.remote.RabbitChannel;
import org.pnplab.phenotype.synchronization.remote.RabbitConnection;
import org.pnplab.phenotype.system.core.AbstractPhenotypeService;
import org.pnplab.stressoncovid19.deprec.OldStressPhenotypeService;

import java.util.concurrent.TimeUnit;

import io.reactivex.rxjava3.annotations.NonNull;
import io.reactivex.rxjava3.core.BackpressureStrategy;
import io.reactivex.rxjava3.core.Flowable;
import io.reactivex.rxjava3.core.Observable;
import io.reactivex.rxjava3.core.Single;
import io.reactivex.rxjava3.disposables.CompositeDisposable;
import io.reactivex.rxjava3.disposables.Disposable;
import java9.util.Optional;

public class StressPhenotypeService extends AbstractPhenotypeService {

    private final CompositeDisposable _disposables = new CompositeDisposable();

    private Observable<Optional<Connection>> _observeRabbitMQConnectivity() {
        Context context = getApplicationContext();
        UserDataManager userDataManager = new UserDataManager(UserDataManager.getSharedPreferencesFromContext(context));

        // Generate testing credentials if none are stored.
        if (!userDataManager.hasRabbitMQCredentials()) {
            userDataManager.generateRabbitMQCredentials();
        }

        // Rabbitmq Connection stream
        Observable<Optional<Connection>> rabbitConnectionStream = userDataManager
                // Observe user credential change.
                .streamRabbitMQCredentials()
                // Generate rabbitmq connection out of it.
                .switchMap(RabbitConnection::streamAndRetryOnFailure);

        return rabbitConnectionStream;
    }

    @Override
    protected void _onBackgroundModeStarted() {
        Context context = getApplicationContext();

        // Get logger.
        AbstractLogger log = PhenotypeInitProvider.getLogger();

        // Get SensorManager.
        SensorManager sensorManager = (SensorManager) context.getSystemService(SENSOR_SERVICE); // @todo use method helper

        // Check sensor manager is not null. Should never happen has this only
        // happen to certain excluded service manager in the context of an
        // instant launch. Note the sensor manager is not part of this list.
        if (sensorManager == null) {
            throw new IllegalStateException("Android Sensor Manager couldn't be retrieved from context.");
        }

        // Setup connectivity thread.
        PhenotypeThread connectivityThread = new PhenotypeThread("rabbitmq");
        connectivityThread.start();
        _disposables.add(connectivityThread);

        // Setup rabbitmq connectivity stream.
        Observable<Optional<Connection>> rabbitConnectivityStream = _observeRabbitMQConnectivity();

        // Setup wifi state stream to decide whether to use rabbit connection or not.
        Observable<Boolean> wifiConnectivityStream = WifiStatus.stream(context, log);

        // Setup data supplier threads.
        PhenotypeThread pingThread = new PhenotypeThread("supplier:ping");
        pingThread.start();
        _disposables.add(pingThread);

        // Setup data acq. + processing streams.
        Flowable<Ping.PingTimePoint> pingStream = Ping.stream();
        Flowable<SignificantMotion.SignificantMotionTimePoint> significantMotionStream = SignificantMotion.stream(context, log); // @todo process timestamp.
        Flowable<Pedometer.PedometerDataPoint> pedometerStream = Pedometer.stream(sensorManager, log);
        Flowable<Accelerometer.AccelerometerEvent> accelerometerStream = Accelerometer.stream(context, log); // @todo filter logic add
        Flowable<BatteryPercentage.BatteryPercentageTimePoint> batteryPercentageStream = Flowable.interval(0, 5, TimeUnit.MINUTES).map((count) -> BatteryPercentage.get(context, log)); // @todo interval acq logic out
        Flowable<OldStressPhenotypeService.WifiStatusTimePoint> wifiStatusStream = WifiStatus.stream(context, log).map(isWifiActive -> new OldStressPhenotypeService.WifiStatusTimePoint(System.currentTimeMillis(), isWifiActive)).toFlowable(BackpressureStrategy.BUFFER); // @todo wrapping logic out

        // Setup sqlite and rabbitmq models.
        RabbitModel pingRabbitModel = new RabbitModel("ping", Ping.PingTimePoint.class, "currentTimeMs", "elapsedTimeMs", "uptimeMs");
        SQLiteModel pingSQLiteModel = new SQLiteModel("ping", Ping.PingTimePoint.class, "currentTimeMs", "elapsedTimeMs", "uptimeMs");

        // Setup sqlite db/adapter.
        SQLiteDatabase pingSqliteDb = new SQLiteDatabase(pingSQLiteModel, context);
        Single<android.database.sqlite.SQLiteDatabase> databasePipe = SQLiteDatabase.getDatabasePipe(pingSQLiteModel, context);

        // issue = both stream and lazy creation.
        _disposables.add(pingSqliteDb);
        Observable<SQLiteAdapter> sqliteAdapterPipe = new SQLiteAdapter(pingSQLiteModel, pingSqliteDb);

        // Setup rabbitmq channels and adapters.
        Observable<Optional<RabbitAdapter>> rabbitAdapterStream = rabbitConnectivityStream
                // Generate channel out of the connection.
                .switchMap(optionalConnection ->
                    optionalConnection.isPresent()
                        ? RabbitChannel.streamAndRetryOnFailure(optionalConnection.get())
                        : Observable.just(Optional.<Channel>empty())
                )
                // Generate adapter out of channel.
                .map(optionalChannel ->
                    optionalChannel.isPresent()
                        ? Optional.of(new RabbitAdapter(pingRabbitModel, optionalChannel.get()))
                        : Optional.empty()
                );

        // Merge rabbit and sqlite adapter depending on wifi and connectivity.
        Observable<WriteAdapter> storeStream = Dispatcher
                .streamRemoteOrLocalFallbackStore(
                        context,
                        log,
                        rabbitStoreStream,
                        sqliteStoreStream
                );
    }

    @Override
    protected void _onBackgroundModeStopped() {
        // Dispose and reset container.
        _disposables.clear();
    }

    class RabbitModel {
        public RabbitModel(String queueName, Class<?> dataClassForTypeRetrieval, String... orderedFields) { }
    }
    class SQLiteModel {
        public SQLiteModel(String queueName, Class<?> dataClassForTypeRetrieval, String primaryKey, String... otherOrderedFields) { }
    }
    interface WriteAdapter {

    }
    class RabbitAdapter implements WriteAdapter {
        public RabbitAdapter(RabbitModel model, Channel channel) { }
    }
    private static class SQLiteDatabase implements Disposable {
        public SQLiteDatabase(SQLiteModel sqliteModel, Context context) { }

        @Override
        public void dispose() {

        }

        @Override
        public boolean isDisposed() {
            return false;
        }
    }
    private static class RxSQLite {
        // both output async stream + lazy creation.
        public static Single<StressPhenotypeService.SQLiteDatabase> DatabasePipe(SQLiteModel sqliteModel, Context context) {
            @NonNull
            Single<StressPhenotypeService.SQLiteDatabase> single = Single
                .create(
                    emitter -> {
                        StressPhenotypeService.SQLiteDatabase sqLiteDatabase = new StressPhenotypeService.SQLiteDatabase(sqliteModel, context);
                        emitter.onSuccess(sqLiteDatabase);
                    }
                );

            return single;
        }

        public static Single<SQLiteAdapter> AdapterPipe() {

        }
    }
    class SQLiteAdapter implements WriteAdapter {
        public SQLiteAdapter(SQLiteModel sqliteModel, StressPhenotypeService.SQLiteDatabase db) { }
    }
}
