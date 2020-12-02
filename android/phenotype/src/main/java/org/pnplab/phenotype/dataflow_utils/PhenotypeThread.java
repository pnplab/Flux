package org.pnplab.phenotype.dataflow;

import android.os.HandlerThread;
import android.os.Looper;

import java.util.concurrent.atomic.AtomicInteger;

import io.reactivex.rxjava3.disposables.Disposable;

// Generate Thread,
// - with Android Loopers (HandlerThread),
// - with custom default settings inspired by android DefaultThreadFactory.
// - with Disposable implementation, to stop the looper safely instead of
//   killing the thread and being compatible with rxjava.
//
// @note
// Everything except run method is expected to be called from caller's
// thread, especially the dispose methods.
public class PhenotypeThread extends HandlerThread implements Disposable {

    private static final AtomicInteger _nextThreadNumber = new AtomicInteger(1);
    private boolean _isDisposed = false;

    public PhenotypeThread(String threadName) {
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
        super(
            String.format(
                "%s %s",
                _nextThreadNumber.getAndIncrement(),
                threadName
            ),
            android.os.Process.THREAD_PRIORITY_BACKGROUND
        );
    }

    public PhenotypeThread(String name, int priority) {
        super(name, priority);
    }

    // Stop thread looper (and thread) on main system dispose.
    @Override
    public synchronized void dispose() {
        // Ensure single call to dispose.
        if (isDisposed()) {
            throw new IllegalStateException("Thread is already disposed");
        }

        // Wait looper tasks to be finished and then end looper (and
        // thread as well). Thus can be safely disposed before other
        // Disposable.
        final Looper looper = this.getLooper();
        looper.quitSafely();

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

}
