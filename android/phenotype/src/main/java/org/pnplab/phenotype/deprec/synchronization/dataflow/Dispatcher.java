package org.pnplab.phenotype.synchronization.dataflow;

import android.content.Context;

import androidx.core.util.Pair;

import org.pnplab.phenotype.logger.AbstractLogger;

import io.reactivex.rxjava3.core.BackpressureOverflowStrategy;
import io.reactivex.rxjava3.core.BackpressureStrategy;
import io.reactivex.rxjava3.core.Flowable;
import io.reactivex.rxjava3.core.Observable;
import java9.util.Optional;

public class Dispatcher {

    public static <T1 extends WritableStore, T2 extends WritableStore> Observable<WritableStore> streamRemoteOrLocalFallbackStore(
            Context context,
            AbstractLogger log,
            Observable<Optional<T1>> remoteStore,
            // We use observable as a single item emitter to enforce item
            // lifecycle encompass the stream lifecycle (through subscription
            // /dispose) and threadeness.
            Observable<T2> localFallbackStore
    ) {
        // Generate a remote connection stream that fallbacks to local on
        // connection problem.
        Observable<WritableStore> remoteStoreFallingBackToLocalOnConnectionFailure = remoteStore
                .switchMap(optionalStore ->
                        optionalStore.isPresent() ?
                                Observable.just(optionalStore.get()) :
                                localFallbackStore
                );

        // Generate a remote connection stream that fallbacks to local on wifi
        // disconnection
        Observable<WritableStore> remoteOrLocalStoreDependingOnWifi = WifiStatus
            .stream(context, log)
            // @todo switchMap or flatMap? @todo triple check this!
            // @warning switchMap would completely erase current record data point instead of forwarding a fallback ?
            // @warning switchMap would dispose current wifi subscription on first result?
            .switchMap(isWifiActive -> {
                // Return SQL store if wifi is inactive.
                if (!isWifiActive) {
                    return localFallbackStore;
                }
                // Attempt to connect to the backend server and return
                // the store on success. On failure, provide a fallback local
                // store while retrying with exponential backoff algorithm.
                else {
                    return remoteStoreFallingBackToLocalOnConnectionFailure;
                }
            });

        // @note
        // Although these two streams seems overlapping, they react to
        // different events at different stage. If we would only rely to
        // remoteStoreFallingBackToLocalOnConnectionFailure, it would possibly
        // make remote connection be used while user is on paid mobile, and
        // would be less clean in case of non-connection (potentially delaying
        // response).

        return remoteOrLocalStoreDependingOnWifi;
    }

    public static <T1, T2> Flowable<Pair<T1, T2>> pairDataAndStoreStreams(Flowable<T1> dataStream, Observable<T2> storeStream) {
        return dataStream
                // @warning withLatestFrom passes-through (ignores) input
                // flowables backbuffers' strategies. I strongly think this is
                // exactly what we need, but to be confirmed/tested.
                .withLatestFrom(
                        Flowable.fromObservable(storeStream, BackpressureStrategy.LATEST),
                        Pair::create
                )
                // Specify a backbuffer w/ specific-size ring buffer.
                //
                // @warning
                // capacity is not considered and set to 16 (comments apply to
                // rxjava 2, we suspect it might have changed in rxjava 3
                // though).
                // cf. https://stackoverflow.com/a/38180308/939741
                // cf. https://github.com/ReactiveX/RxJava/pull/1836
                //
                // rxjava 3 mentions "experimental version (not available in
                // RxJava 1.0)".
                // cf. https://github.com/ReactiveX/RxJava/wiki/Backpressure
                .onBackpressureBuffer(32, null, BackpressureOverflowStrategy.DROP_OLDEST);
    }
}
