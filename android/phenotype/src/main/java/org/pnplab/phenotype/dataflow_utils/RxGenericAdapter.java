package org.pnplab.phenotype.dataflow;

import org.pnplab.phenotype.rabbitmq.RabbitAdapter;
import org.pnplab.phenotype.sqlite.SQLiteAdapter;

import io.reactivex.rxjava3.annotations.NonNull;
import io.reactivex.rxjava3.core.BackpressureStrategy;
import io.reactivex.rxjava3.core.Flowable;
import io.reactivex.rxjava3.core.FlowableTransformer;
import io.reactivex.rxjava3.core.Observable;
import io.reactivex.rxjava3.core.ObservableTransformer;
import io.reactivex.rxjava3.core.Single;
import java9.util.Optional;

public class RxGenericAdapter {

    // A composite adapter that forward to the appropriate adapter. This is
    // only intended to use as part of RxGenericAdapter class (thus the private
    // constructors), as its implementation is stateless and thus useless
    // anywhere else.
    public final static class Adapter {
        private final RabbitAdapter _remoteAdapter;
        private final SQLiteAdapter _fallbackAdapter;

        private Adapter(RabbitAdapter remoteAdapter, SQLiteAdapter fallbackAdapter) {
            this._remoteAdapter = remoteAdapter;
            this._fallbackAdapter = fallbackAdapter;
        }

        private Adapter(SQLiteAdapter fallbackAdapterInstance) {
            this._remoteAdapter = null;
            this._fallbackAdapter = fallbackAdapterInstance;
        }

        public void write(Object data) {
            // Only use fallback adapter if there is no remote one.
            if (_remoteAdapter == null) {
                _fallbackAdapter.write(data);
                return;
            }

            // Try to write on remote adapter otherwise.
            try {
                _remoteAdapter.write(data);
            }
            // Fallback in case of failure.
            catch (Exception exc) {
                // @todo Log
                _fallbackAdapter.write(data);
            }
        }
    }

    public static ObservableTransformer<Boolean, Adapter> DispatcherAdapterPipe(Observable<Optional<RabbitAdapter>> remoteAdapterStream, Single<SQLiteAdapter> fallbackAdapterStream) {
        return upstream -> upstream
            .switchMap(useRemote -> {
                if (useRemote) {
                    return fallbackAdapterStream
                        .map(fallbackAdapter -> new Adapter(fallbackAdapter))
                        .toObservable();
                }
                else {
                    return remoteAdapterStream
                        .map(optionalRemoteAdapter -> {
                            @NonNull SQLiteAdapter fallbackAdapter = fallbackAdapterStream.blockingGet();

                            if (!optionalRemoteAdapter.isPresent()) {
                                return new Adapter(fallbackAdapter);
                            }
                            else {
                                RabbitAdapter remoteAdapterInstance = optionalRemoteAdapter.get();
                                return new Adapter(remoteAdapterInstance, fallbackAdapter);
                            }
                        });
                }
            });
    }

    public static <T> FlowableTransformer<T, Runnable> WriteActionPipe(Observable<Adapter> adapterPipe) {
        return upstream -> upstream
            .withLatestFrom(
                Flowable.fromObservable(adapterPipe, BackpressureStrategy.LATEST),
                (data, adapter) -> new Runnable() {
                    @Override
                    public void run() {
                        adapter.write(data);
                    }
                }
            );
    }
}
