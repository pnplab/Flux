package org.pnplab.stressoncovid19;

import android.content.Context;
import android.os.HandlerThread;
import android.os.Looper;
import android.text.TextUtils;
import android.util.Log;

import androidx.core.util.Pair;

import org.pnplab.phenotype.logger.AbstractLogger;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.Queue;

import org.pnplab.phenotype.deprec.synchronization.dataflow.Dispatcher;
import org.pnplab.phenotype.deprec.synchronization.local.SQLiteStore;
import org.pnplab.phenotype.deprec.synchronization.dataflow.WritableStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import io.reactivex.rxjava3.android.schedulers.AndroidSchedulers;
import io.reactivex.rxjava3.core.BackpressureStrategy;
import io.reactivex.rxjava3.core.Flowable;
import io.reactivex.rxjava3.core.Observable;
import io.reactivex.rxjava3.disposables.CompositeDisposable;
import io.reactivex.rxjava3.disposables.Disposable;
import io.reactivex.rxjava3.subjects.PublishSubject;
import java9.util.Lists;

// @todo remove custom abstraction with sl4j one.
public class MyLogger extends AbstractLogger {

    private Logger _log;
    private PublishSubject<LogTimePoint> _logStream;

    private AbstractLogger _noopLogger = new AbstractLogger() {
        @Override
        public void initialize(Context context) {

        }

        @Override
        public void i(String msg) {

        }

        @Override
        public void e(String msg) {

        }

        @Override
        public void w(String msg) {

        }

        @Override
        public void d(String msg) {

        }

        @Override
        public void v(String msg) {

        }

        @Override
        public void wtf(String msg) {

        }

        @Override
        public void t() {

        }
    };

    // Generate thread to process log storage and transfer in order to prevent
    // NetworkOnMainThread exception (from rxjava non-android Schedulers.io()).
    // + minimize CPU overload and thread block from logs i/o + network
    // storage.
    // @todo dispose/cleanup thread ?
    private HandlerThread _thread = StressService._handlerThreadFactory.newThread("logger");
    private Looper _looper = _thread.getLooper();
    private HandlerThread _connectionThread = StressService._handlerThreadFactory.newThread("loggerDbConnection");
    private Looper _connectionLooper = _connectionThread.getLooper();

    // WritableStore data to local storage.
    private <T> Disposable _processData(Context context, Flowable<T> dataStream, String tableName, Class<?> dataClass, String primaryKey, String... otherOrderedFields) {
        /* ACQUISITION */

        CompositeDisposable disposables = new CompositeDisposable();

        // Retrieve local store to register item into.
        List<String> fieldNames = new ArrayList<>();
        fieldNames.add(primaryKey);
        fieldNames.addAll(Lists.of(otherOrderedFields));

        Observable<SQLiteStore> sqliteStoreStream = SQLiteStore
                .streamWriter(context, tableName, dataClass, primaryKey, otherOrderedFields);

        // Bind gps data to the store.
        Flowable<Pair<T, SQLiteStore>> dataStorageBinding = Dispatcher
                .pairDataAndStoreStreams(
                        dataStream
                            .subscribeOn(AndroidSchedulers.from(_looper)),
                        sqliteStoreStream
                            .subscribeOn(AndroidSchedulers.from(_connectionLooper))
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
                        Log.e("phenotype", "Logging Storage Error", exc);
                    }
                }, err -> {
                    Log.e("phenotype", "Logging Error", err);
                });

        // WritableStore disposable to clear subscriptions/listeners/... once requested.
        disposables.add(subscription);

        // ...Remote data transfer is done from the service. Everything is
        // stored locally first to avoid recursive logging due to connectivity
        // issues with the remote server during logging.

        // Return disposables.
        return disposables;
    }

    public static class LogTimePoint {
        public final long timestamp;
        public final String level;
        public final String log;

        public LogTimePoint(long timestamp, String level, String log) {
            this.timestamp = timestamp;
            this.level = level;
            this.log = log;
        }
    }

    @Override
    public void initialize(Context context) {
        // _log = LoggerFactory.getLogger(MainActivity.class);

        _log = LoggerFactory.getLogger("Phenotype");

        // Retrieve wifi status stream.
        _logStream = PublishSubject.create();
        _logStream.publish().autoConnect();

        Disposable logSubscription = this._processData(
                context, _logStream.publish().autoConnect().toFlowable(BackpressureStrategy.DROP),
                "log", LogTimePoint.class,
                "timestamp", "level", "log"
        );
    }

    @Override
    public void i(String msg) {
        _log.info(msg);

        long timestamp = System.currentTimeMillis();
        String level = "info";
        LogTimePoint log = new LogTimePoint(timestamp, level, String.format("%s: %s", Thread.currentThread().getName(), msg));
        _logStream.onNext(log);
    }

    @Override
    public void e(String msg) {
        _log.error(msg);

        long timestamp = System.currentTimeMillis();
        String level = "error";
        LogTimePoint log = new LogTimePoint(timestamp, level, String.format("%s: %s", Thread.currentThread().getName(), msg));
        _logStream.onNext(log);
    }

    @Override
    public void w(String msg) {
        _log.warn(msg);

        long timestamp = System.currentTimeMillis();
        String level = "warn";
        LogTimePoint log = new LogTimePoint(timestamp, level, String.format("%s: %s", Thread.currentThread().getName(), msg));
        _logStream.onNext(log);
    }

    @Override
    public void d(String msg) {
        _log.debug(msg);

        long timestamp = System.currentTimeMillis();
        String level = "debug";
        LogTimePoint log = new LogTimePoint(timestamp, level, String.format("%s: %s", Thread.currentThread().getName(), msg));
        _logStream.onNext(log);
    }

    @Override
    public void v(String msg) {
        _log.trace(msg);

        long timestamp = System.currentTimeMillis();
        String level = "verbose";
        LogTimePoint log = new LogTimePoint(timestamp, level, String.format("%s: %s", Thread.currentThread().getName(), msg));
        _logStream.onNext(log);
    }

    @Override
    public void wtf(String msg) {
        _log.error(msg);

        long timestamp = System.currentTimeMillis();
        String level = "wtf";
        LogTimePoint log = new LogTimePoint(timestamp, level, String.format("%s: %s", Thread.currentThread().getName(), msg));
        _logStream.onNext(log);
    }

    @Override
    public void t() {
        StackTraceElement[] stacktrace = Thread.currentThread().getStackTrace();

        // Get current timestamp.
        String timestamp = "" + System.currentTimeMillis();

        // List method calls until given limit.
        Queue<String> callStack = new LinkedList<>();
        int fromStackItemIndex = 4; // this method callee.
        int untilStackItemIndex = Math.min(stacktrace.length, fromStackItemIndex + 2); // max 1 call stack item to not be too verbose.
        for (int i = fromStackItemIndex; i < untilStackItemIndex; ++i) {
            StackTraceElement stacktraceItem = stacktrace[i];
            String stacktraceItemStr = stacktraceItem.getMethodName() + " (" + _getShortClassName(stacktraceItem.getClassName()) + ")";
            callStack.add(stacktraceItemStr);
        }
        String callStackStr = TextUtils.join(" < ", callStack);

        _log.trace(callStackStr);
    }

    private String _getShortClassName(String fullClassName) {
        int classNameIndexInString = fullClassName.lastIndexOf('.') + 1;
        return fullClassName.substring(classNameIndexInString);
    }
}
