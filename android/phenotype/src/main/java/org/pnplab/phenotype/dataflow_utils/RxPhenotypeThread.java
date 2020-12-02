package org.pnplab.phenotype.dataflow;

import android.annotation.SuppressLint;

import java.util.concurrent.TimeUnit;

import io.reactivex.rxjava3.android.schedulers.AndroidSchedulers;
import io.reactivex.rxjava3.core.Scheduler;
import io.reactivex.rxjava3.disposables.Disposable;

// RxAndroid.Scheduler for single thread, whose lifecycle is bound to the
// RxJava's stream.
public class RxPhenotypeThread extends Scheduler {
        private final String _threadName;
        private Scheduler _childScheduler;
        private PhenotypeThread _thread;

        public RxPhenotypeThread(String threadName) {
            this._threadName = threadName;
        }

        @Override
        public synchronized void start() {
            super.start();

            // Create new thread.
            _thread = new PhenotypeThread(_threadName);

            // Start thread.
            _thread.start();

            // Setup underlying scheduler.
            // @warning #getLooper returns null if thread is not started
            _childScheduler = AndroidSchedulers.from(_thread.getLooper());
        }

        @Override
        public synchronized void shutdown() {
            // Cleanup child scheduler.
            _childScheduler.shutdown();
            _childScheduler = null;

            // Stop and cleanup thread.
            if (!_thread.isDisposed()) {
                _thread.dispose();
            }
            _thread = null;
        }

        @Override
        @SuppressLint("NewApi") // Async will only be true when the API is available to call.
        public synchronized Disposable scheduleDirect(Runnable run, long delay, TimeUnit unit) {
            return _childScheduler.scheduleDirect(run, delay, unit);
        }

        @Override
        public synchronized @io.reactivex.rxjava3.annotations.NonNull Worker createWorker() {
            return _childScheduler.createWorker();
        }
    }