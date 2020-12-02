package org.pnplab.phenotype.dataflow;

import org.pnplab.phenotype.core.AbstractInitProvider;
import org.pnplab.phenotype.core.AbstractService;
import org.pnplab.phenotype.logger.AbstractLogger;


// AbstractService with implementation of a default sensor dataflow.
//
// @todo
// 1. upload on server to Timeseries Db
// 2. check sensors missing timepoints through visualisation.

// https://developer.android.com/topic/performance/power/setup-battery-historian
// https://developer.android.com/topic/performance/power/battery-historian
public class Service extends AbstractService {

    private final AbstractLogger _log = AbstractInitProvider.getLogger();

    @Override
    protected void _onBackgroundModeStarted() {
//
//        _log.d("start");
//
//        // Check internet connection once network connection has been validated.
//        // @todo chain
//
//        Context context = getApplicationContext();
//        @NotNull Observable<Boolean> wifiStatus = WifiStatus.stream(context, _log);
//
//        Observable<Optional<RabbitStore>> rabbitStoreStream = wifiStatus
//                // switchMap or flatMap?
//                // @warning switchMap would dispose current wifi subscription on first result?
//                .<Optional<Channel>>switchMap(isWifiActive -> isWifiActive ?
//                        // Try to provide rabbit mq connection, or empty item
//                        // (to be processed as local storage fallback) in
//                        // case of failure (as well as delayed broken
//                        // connection).
//                        RabbitConnection
//                            .stream()
//                            // Split error into empty value + error, as
//                            // - we want the outer stream to have an empty
//                            //   channel event in case of connection failure so
//                            //   it can fallback to local storage for instance.
//                            // - using error + retryWhen doesn't allow to emit
//                            //   that empty event.
//                            // - using startWith wont be retriggered after
//                            //   error recovery.
//                            .onErrorResumeNext(err ->
//                                Observable
//                                    .concat(
//                                        Observable.just(Optional.empty()),
//                                        Observable.error(err)
//                                    )
//                            )
//                            // Retry (the whole chain, not just the last
//                            // operator) on error.
//                            .retryWhen(inputObs -> inputObs
//                                // Calculate current attempt number by
//                                // converting the error objects into their
//                                // index within the stream.
//                                .scan(1, (i, error) -> ++i)
//                                // Return exponential back-off timed source.
//                                .flatMap(
//                                    i ->
//                                        Observable.timer(
//                                            Double.valueOf(Math.pow(2., i)).longValue(),
//                                            TimeUnit.SECONDS
//                                        )
//                                )
//                            )
//                            // Prevent empty observable being retriggered at
//                            // each new attempt when connection is failing.
//                            .distinctUntilChanged() :
//                        // Provide empty item (to be processed as local storage
//                        // fallback) when wifi is/goes off.
//                        Observable.just(Optional.empty())
//                )
//                // Create rabbitmq (or empty) store out of rabbitmq channel.
//                .map(optionalChannel -> optionalChannel.isPresent() ?
//                        // #todo @deprecated NO LONGER GENERIC INSTANCE!
//                        Optional.of(new RabbitStore(optionalChannel.get(), Ping.PingTimePoint.class.getSimpleName(), Ping.PingTimePoint.class, "time")) :
//                        Optional.<RabbitStore>empty()
//                );
//
//        /* PING */
//
//        // Generate sqlite store for ping.
//        SQLiteStore pingSQLiteStore = new SQLiteStore(context, Ping.PingTimePoint.class.getSimpleName(), Ping.PingTimePoint.class, "time");
//
//        // Continue with empty connection in case rabbitmq connection fails.
//        Observable<WritableStore> storeStream = rabbitStoreStream
//                .map(optionalRabbitStore -> optionalRabbitStore.isPresent() ?
//                        optionalRabbitStore.get() :
//                        pingSQLiteStore
//                );
//
//        // Retrieve data stream.
//        Flowable<Ping.PingTimePoint> dataStream = Ping.stream();
//
//        // WritableStore datastream.
//        Flowable<Pair<Ping.PingTimePoint, WritableStore>> outputStream = dataStream
//                // @warning withLatestFrom passes-through (ignores) input
//                // flowables backbuffers' strategies.
//                .withLatestFrom(
//                        Flowable.fromObservable(storeStream, BackpressureStrategy.LATEST),
//                        Pair::create
//                )
//                // Specify a backbuffer w/ specific-size ring buffer.
//                //
//                // @warning
//                // capacity is not considered and set to 16 (comments apply to
//                // rxjava 2, we suspect it might have changed in rxjava 3
//                // though).
//                // cf. https://stackoverflow.com/a/38180308/939741
//                // cf. https://github.com/ReactiveX/RxJava/pull/1836
//                //
//                // rxjava 3 mentions "experimental version (not available in
//                // RxJava 1.0)".
//                // cf. https://github.com/ReactiveX/RxJava/wiki/Backpressure
//                .onBackpressureBuffer(32, null, BackpressureOverflowStrategy.DROP_OLDEST);
//
//        @NonNull Disposable disposable = outputStream // @todo dispose
//                .subscribe(p -> {
//                    Ping.PingTimePoint data = p.first;
//                    WritableStore store = p.second;
//                    // _log.d("subs.store: " + store.getClass().toString() + " <- " + data.time);
//
//                    store.write(data);
//
//                    // 1. write to rabbitmq
//                    // 2. write to sqlite.
//                }, err -> {
//                    _log.e("subs.error: " + err.toString());
//
//                    Writer out = new Writer() {
//                        StringBuffer _strBuffer = new StringBuffer();
//
//                        @Override
//                        public void write(char[] cbuf, int off, int len) throws IOException {
//                            _strBuffer.append(cbuf, off, len);
//                        }
//
//                        @Override
//                        public void flush() throws IOException {
//                        }
//
//                        @Override
//                        public void close() throws IOException {
//                            _log.e(_strBuffer.toString());
//                        }
//                    };
//
//                    PrintWriter p = new PrintWriter(out);
//                    err.printStackTrace(p);
//                    p.flush();
//                    p.close();
//                });
//
//        /* ACCELEROMETER */
//
//        SQLiteStore accelerometerSQLiteStore = new SQLiteStore(context, Accelerometer.AccelerometerTimePoint.class.getSimpleName(), Accelerometer.AccelerometerTimePoint.class);
//
//        Observable<WritableStore> accelerometerStoreStream = rabbitStoreStream
//                .map(optionalRabbitStore -> optionalRabbitStore.isPresent() ?
//                        optionalRabbitStore.get() :
//                        accelerometerSQLiteStore
//                );
//
//
//        // Retrieve data stream.
//        Accelerometer accelerometer = new Accelerometer();
//        Flowable<Accelerometer.AccelerometerTimePoint> accelerometerDataStream = accelerometer
//                .stream(context, _log)
//                .filter(event -> event instanceof Accelerometer.AccelerometerTimePoint)
//                .map(event -> (Accelerometer.AccelerometerTimePoint) event);
//
//        // WritableStore datastream.
//        Flowable<Pair<Accelerometer.AccelerometerTimePoint, WritableStore>> accelerometerOutputStream = accelerometerDataStream
//                // @warning withLatestFrom passes-through (ignores) input
//                // flowables backbuffers' strategies.
//                .withLatestFrom(
//                        Flowable.fromObservable(accelerometerStoreStream, BackpressureStrategy.LATEST),
//                        Pair::create
//                )
//                // Specify a backbuffer w/ specific-size ring buffer.
//                //
//                // @warning
//                // capacity is not considered and set to 16 (comments apply to
//                // rxjava 2, we suspect it might have changed in rxjava 3
//                // though).
//                // cf. https://stackoverflow.com/a/38180308/939741
//                // cf. https://github.com/ReactiveX/RxJava/pull/1836
//                //
//                // rxjava 3 mentions "experimental version (not available in
//                // RxJava 1.0)".
//                // cf. https://github.com/ReactiveX/RxJava/wiki/Backpressure
//                .onBackpressureBuffer(256, null, BackpressureOverflowStrategy.DROP_OLDEST);
//
//        @NonNull Disposable accelerometerDisposable = accelerometerOutputStream // @todo dispose
//                .subscribe(p -> {
//                    Accelerometer.AccelerometerTimePoint data = p.first;
//                    WritableStore store = p.second;
//                    // _log.d("subs.store: " + store.getClass().toString() + " <- " + data.timestamp);
//
//                    store.write(data);
//
//                    // 1. write to rabbitmq
//                    // 2. write to sqlite.
//                }, err -> {
//                    _log.e("subs.error: " + err.toString());
//
//                    Writer out = new Writer() {
//                        StringBuffer _strBuffer = new StringBuffer();
//
//                        @Override
//                        public void write(char[] cbuf, int off, int len) throws IOException {
//                            _strBuffer.append(cbuf, off, len);
//                        }
//
//                        @Override
//                        public void flush() throws IOException {
//                        }
//
//                        @Override
//                        public void close() throws IOException {
//                            _log.e(_strBuffer.toString());
//                        }
//                    };
//
//                    PrintWriter p = new PrintWriter(out);
//                    err.printStackTrace(p);
//                    p.flush();
//                    p.close();
//                });
    }

    @Override
    protected void _onBackgroundModeStopped() {

    }

}
