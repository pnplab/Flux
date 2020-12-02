package org.pnplab.stressoncovid19;

import android.content.Context;
import android.hardware.SensorManager;

import androidx.annotation.NonNull;

import com.rabbitmq.client.Connection;

import org.pnplab.phenotype.dataflow_utils.PhenotypeThread;
import org.pnplab.phenotype.dataflow_utils.RxGenericAdapter;
import org.pnplab.phenotype.dataflow_utils.RxPhenotypeThread;
import org.pnplab.phenotype.producer.Ping;
import org.pnplab.phenotype.producer.Accelerometer;
import org.pnplab.phenotype.producer.BatteryPercentage;
import org.pnplab.phenotype.producer.Pedometer;
import org.pnplab.phenotype.producer.SignificantMotion;
import org.pnplab.phenotype.logger.AbstractLogger;
import org.pnplab.phenotype.deprec.synchronization.dataflow.WifiStatus;
import org.pnplab.phenotype.core.AbstractService;
import org.pnplab.phenotype.rabbitmq.RabbitAdapter;
import org.pnplab.phenotype.rabbitmq.RabbitCredentials;
import org.pnplab.phenotype.rabbitmq.RabbitModel;
import org.pnplab.phenotype.rabbitmq.RxRabbit;
import org.pnplab.phenotype.sqlite.RxSQLite;
import org.pnplab.phenotype.sqlite.SQLiteAdapter;
import org.pnplab.phenotype.sqlite.SQLiteDatabase;
import org.pnplab.phenotype.sqlite.SQLiteModel;
import org.pnplab.stressoncovid19.deprec.OldStressService;

import java.util.Collections;
import java.util.concurrent.TimeUnit;

import io.reactivex.rxjava3.android.schedulers.AndroidSchedulers;
import io.reactivex.rxjava3.core.BackpressureStrategy;
import io.reactivex.rxjava3.core.Flowable;
import io.reactivex.rxjava3.core.FlowableTransformer;
import io.reactivex.rxjava3.core.Observable;
import io.reactivex.rxjava3.core.Scheduler;
import io.reactivex.rxjava3.core.Single;
import io.reactivex.rxjava3.disposables.CompositeDisposable;
import java9.util.Optional;
import java9.util.stream.Stream;

public class StressService extends AbstractService {

    private final CompositeDisposable _disposables = new CompositeDisposable();

    private Observable<RabbitCredentials> _observeRabbitMQCredentials() {
        Context context = getApplicationContext();
        UserDataManager userDataManager = new UserDataManager(UserDataManager.getSharedPreferencesFromContext(context));

        // Generate testing credentials if none are stored.
        if (!userDataManager.hasRabbitMQCredentials()) {
            userDataManager.generateRabbitMQCredentials();
        }

        // Rabbitmq Connection stream
        Observable<RabbitCredentials> rmqCredentialStream = userDataManager
                // Observe user credential change.
                .streamRabbitMQCredentials();

        return rmqCredentialStream;
    }

    @Override
    protected void _onBackgroundModeStarted() {
        Context context = getApplicationContext();

        // Get logger.
        AbstractLogger log = InitProvider.getLogger();

        // Get SensorManager.
        SensorManager sensorManager = (SensorManager) context.getSystemService(SENSOR_SERVICE); // @todo use method helper

        // Check sensor manager is not null. Should never happen has this only
        // happen to certain excluded service manager in the context of an
        // instant launch. Note the sensor manager is not part of this list.
        if (sensorManager == null) {
            throw new IllegalStateException("Android Sensor Manager couldn't be retrieved from context.");
        }

        // Setup connectivity thread.
        Scheduler rxConnectivityThread = new RxPhenotypeThread("connectivity");
        PhenotypeThread connectivityThread = new PhenotypeThread("rabbitmq");
        connectivityThread.start();
        _disposables.add(connectivityThread);

        // Setup data acq. + processing streams.
        Flowable<Ping.PingTimePoint> pingStream = Ping.stream();
        Flowable<SignificantMotion.SignificantMotionTimePoint> significantMotionStream = SignificantMotion.stream(context, log); // @todo process timestamp.
        Flowable<Pedometer.PedometerDataPoint> pedometerStream = Pedometer.stream(sensorManager, log);
        Flowable<Accelerometer.AccelerometerEvent> accelerometerStream = Accelerometer.stream(context, log); // @todo filter logic add
        Flowable<BatteryPercentage.BatteryPercentageTimePoint> batteryPercentageStream = Flowable.interval(0, 5, TimeUnit.MINUTES).map((count) -> BatteryPercentage.get(context, log)); // @todo interval acq logic out
        Flowable<OldStressService.WifiStatusTimePoint> wifiStatusStream = WifiStatus.stream(context, log).map(isWifiActive -> new OldStressService.WifiStatusTimePoint(System.currentTimeMillis(), isWifiActive)).toFlowable(BackpressureStrategy.BUFFER); // @todo wrapping logic out

        // Setup rabbitmq connection.
        Observable<Optional<Connection>> rmqConnectionPipe = RxRabbit
            .ConnectionPipe(new RabbitCredentials("111111", "111111"))
            .subscribeOn(AndroidSchedulers.from(connectivityThread.getLooper()))
            .compose(RxRabbit.RetryPipe())
            .compose(RxRabbit.RefCountPipe());

        // Connect data stream to adapter.
        Flowable<Runnable> pingWriteStream = pingStream
            .compose(OutputPipe(log, rxConnectivityThread, rmqConnectionPipe, "ping", Ping.PingTimePoint.class, "currentTimeMs", "elapsedTimeMs", "uptimeMs"));

        // Start data recording and add recording to disposable list.
        _disposables.add(pingWriteStream.subscribe(Runnable::run, log::exc));
    }

    @NonNull
    private <T> FlowableTransformer<T, Runnable> OutputPipe(AbstractLogger log, Scheduler rxConnectivityThread, Observable<Optional<Connection>> rmqConnectionPipe, String entityName, Class<T> entityClass, String primaryKey, String... orderedFields) {
        Context context = getApplicationContext();

        // Setup sqlite and rabbitmq models.
        RabbitModel pingRabbitModel = new RabbitModel(entityName, entityClass, Stream.of(Collections.singletonList(primaryKey), orderedFields).flatMap(Stream::of).toArray(String[]::new));
        SQLiteModel pingSQLiteModel = new SQLiteModel(entityName, entityClass, primaryKey, orderedFields);

        // Setup i/o + work thread.
        RxPhenotypeThread thread = new RxPhenotypeThread(entityName);

        // Setup sqlite db.
        Single<SQLiteDatabase> databasePipe = RxSQLite
            .DatabasePipe(pingSQLiteModel, context)
            .subscribeOn(thread);

        // Setup sqlite adapter.
        Single<SQLiteAdapter> sqliteAdapterPipe = databasePipe
            .compose(RxSQLite.AdapterPipe(pingSQLiteModel));

        // Setup rabbitmq channel and adapter.
        Observable<Optional<RabbitAdapter>> rmqAdapterPipe = rmqConnectionPipe
            .observeOn(thread)
            .compose(RxRabbit.ChannelPipe("data"))
            .compose(RxRabbit.AdapterPipe(pingRabbitModel));

        // Setup wifi state stream to decide whether to use rabbit connection or not.
        Observable<Boolean> wifiStatusPipe = WifiStatus
            .stream(context, log) // @todo refactor
            .subscribeOn(rxConnectivityThread);

        // Setup generic adapter.
        // Merge rabbit and sqlite adapter depending on wifi and connectivity.
        Observable<RxGenericAdapter.Adapter> genericAdapterPipe = wifiStatusPipe
            .compose(RxGenericAdapter.DispatcherAdapterPipe(rmqAdapterPipe, sqliteAdapterPipe));

        // Connect data stream to adapter.
        return upstream ->
            upstream
                .subscribeOn(thread)
                .compose(RxGenericAdapter.WriteActionPipe(genericAdapterPipe));
    }

    @Override
    protected void _onBackgroundModeStopped() {
        // Dispose, reset container and prevent to add new disposable within
        // the CompositeDisposable.
        _disposables.dispose();
    }
}
