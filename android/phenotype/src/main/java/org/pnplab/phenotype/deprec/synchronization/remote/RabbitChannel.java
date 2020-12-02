package org.pnplab.phenotype.deprec.synchronization.remote;

import android.util.Log;

import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ShutdownListener;
import com.rabbitmq.client.ShutdownSignalException;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

import io.reactivex.rxjava3.core.Observable;
import java9.util.Optional;

public class RabbitChannel {

    public static Observable<Optional<Channel>> streamAndRetryOnFailure(Connection connection) {
        return Observable
            .<Channel>create(producer -> {
                try {
                    // Create channel.
                    // @note
                    // Will be recreated automatically by rabbitmq in case of
                    // failure recovery, which is not the case in our code).
                    // Should create one by thread/queue. Channel are not fully
                    // thread-safe.
                    // cf. https://www.rabbitmq.com/api-guide.html#concurrency
                    Channel channel = connection.createChannel();

                    // Listen to channel shutdown and forward exception.
                    ShutdownListener shutdownListener = new ShutdownListener() {
                        @Override
                        public void shutdownCompleted(ShutdownSignalException cause) {
                            // Forward channel shutdown exception.
                            if (!producer.isDisposed()) {
                                producer.onError(cause);
                            }
                        }
                    };
                    channel.addShutdownListener(shutdownListener);

                    // Close listeners and channel on dispose.
                    producer.setCancellable(() -> {
                        // Cleanup listener.
                        channel.removeShutdownListener(shutdownListener);

                        // Close channel.
                        if (channel.isOpen()) {
                            channel.close();
                        }
                    });

                    // Assert the data exchange already exists or throw
                    // IOException.
                    //
                    // Topic exchanges allow to use regexp to route multiple
                    // specific message routing keys to more general queues, in our
                    // case user-specific routing keys to any-user global queues).
                    //
                    // Our data exchange is a topic exchange used to be able to
                    // have fine-grained user permission (global any userId
                    // consume permission with user specific publish
                    // permission).
                    //
                    // @warning
                    // Passive is required as user doesn't likely have
                    // permission to configure exchange, thus it will only check
                    // if exchange already exists and won't create it otherwise
                    // (which is the role of the consumer).
                    //
                    // @warning
                    // This may throw from time to time at server restart, since
                    // rabbitmq consumer takes a bit of time to launch. The
                    // rabbitmq connection has to be retried in these case. This
                    // is one of the reason we swallow and forward potential
                    // exceptions to rxjava stream onError (as it can be
                    // interpreted by rxjava retry operator). This is also the
                    // sole reason we declare this here instead of outside
                    // RabbitChannel. @todo out would be a bit more clean.
                    channel.exchangeDeclarePassive("data");

                    // @note
                    // Message publish confirmation is disabled by default.
                    // cf. https://www.rabbitmq.com/tutorials/tutorial-seven-java.html

                    // Forward channel to stream.
                    if (!producer.isDisposed()) {
                        producer.onNext(channel);
                    }
                }
                catch (IOException exc) {
                    // Forward network exception to stream.
                    if (!producer.isDisposed()) {
                        producer.onError(exc);
                    }
                }
            })
            // Split error into empty value + error, as
            // - we want the outer stream to have an empty
            //   _channel event in case of connection failure so
            //   it can fallback to local storage for instance.
            // - using error + retryWhen doesn't allow to emit
            //   that empty event.
            // - using startWith wont be retriggered after
            //   error recovery.
            .map(Optional::of) // Observable#onErrorResumeNext requires ~ same input type as output.
            .onErrorResumeNext(err ->
                Observable
                    .concat(
                        Observable.just(Optional.empty()),
                        Observable.error(err)
                    )
            )
            // Retry (the whole chain, not just the last operator) on error.
            .retryWhen(inputObs ->
                inputObs
                    // Calculate current attempt number by
                    // converting the error objects into their
                    // index within the stream.
                    .scan(1, (i, error) -> ++i)
                    // Return exponential back-off timed source with max 15
                    // minutes.
                    .flatMap(
                        i ->
                            Observable.timer(
                                Math.min(Double.valueOf(Math.pow(2., i)).longValue(), 60 * 15),
                                TimeUnit.SECONDS
                            )
                    )
            )
            .doOnEach(event -> {
                Log.d("Phenotype", event.toString());
            })
            // Prevent empty observable being retriggered at
            // each new attempt when connection is failing.
            .distinctUntilChanged();
            // ...no ref counting here, as we expect one channel per
            // thread!
    }
}
