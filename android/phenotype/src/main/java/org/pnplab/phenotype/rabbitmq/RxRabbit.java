package org.pnplab.phenotype.rabbitmq;

import android.util.Log;

import androidx.annotation.NonNull;

import com.rabbitmq.client.BlockedListener;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ShutdownListener;
import com.rabbitmq.client.ShutdownSignalException;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

import io.reactivex.rxjava3.core.Observable;
import io.reactivex.rxjava3.core.ObservableTransformer;
import java9.util.Optional;

public class RxRabbit {

    public static @NonNull
    Observable<Optional<Connection>> ConnectionPipe(RabbitCredentials credentials) {
        return Observable.<Optional<Connection>>create(
            emitter -> {
                RabbitConnection connectionWrapper
                    = new RabbitConnection("192.99.152.104", 5672, credentials);

                // Start connection attempt.
                //
                // @note
                // Names the connection as the userId, such as,
                // - connection appears as such in the rabbitmq server
                //   management admin UI.
                // - userId can be retrieved using
                //   `channel.getConnection().getClientProvidedName()` across
                //   the stream, without having to set up an additional class/
                //   pair layer to do so. This is required in order to set the
                //   userId property and/or the routing keys consumer will use
                //   to retrieve which user the data comes from.
                //   @todo this is dirty, share userId across app another way.
                Connection connection;
                try {
                    connection = connectionWrapper.run(credentials.userId);
                }
                catch (RabbitConnection.ConnectionFailureException
                    | RabbitConnection.ConnectionTimeoutException
                    | RabbitConnection.ConnectionOnMainThreadException exc
                ) {
                    // Forward exception as error.
                    emitter.onError(exc);

                    // Ignore all subsequent connection-related
                    // instructions.
                    return;
                }

                // Forward disconnection events as errors.
                ShutdownListener shutdownListener = cause -> {
                    if (!emitter.isDisposed()) {
                        emitter.onError(cause);
                    }
                };

                // Forward suspension events (due to server resources (cpu, i/o,
                // ...) overwhelmed for instance) as empty connections.
                // cf. https://www.rabbitmq.com/connection-blocked.html#notifications
                BlockedListener blockedListener = new BlockedListener() {
                    @Override
                    public void handleBlocked(String reason) {
                        if (!emitter.isDisposed()) {
                            emitter.onNext(Optional.empty());
                        }
                    }

                    @Override
                    public void handleUnblocked() {
                        if (!emitter.isDisposed()) {
                            emitter.onNext(Optional.of(connection));
                        }
                    }
                };

                // Close listeners + connection when rxjava subscription is
                // disposed.
                emitter.setCancellable(() -> {
                    // Cleanup listeners.
                    connection.removeBlockedListener(blockedListener);
                    connection.removeShutdownListener(shutdownListener);

                    // Do nothing if connection is already closed, otherwise
                    // would #close throws AlreadyClosedException. This dual
                    // disconnection happens due to:
                    // 1st. Automatic disconnection caught from server (
                    //      considering addShutdownListener is triggered before
                    //      the stream cancel is triggered).
                    // 2nd. The rxjava stream being disposed through a
                    //      downstream switchmap after "wifi lost events"
                    //      received in our use case.
                    if (!connection.isOpen()) {
                        return;
                    }
                    // Close connection due to user disposing the stream.
                    else {
                        connection.close();
                    }
                });

                // Setup listeners after cleanup has been set up, just for
                // safety, although this shouldn't make any difference
                // since this code is synchronous.
                connection.addShutdownListener(shutdownListener);
                connection.addBlockedListener(blockedListener);

                // Forward the current connection to stream.
                if (!emitter.isDisposed()) {
                    emitter.onNext(Optional.of(connection));
                }
            }
        );
    }

    public static @NonNull
    <T> ObservableTransformer<Optional<T>, Optional<T>> RetryPipe() {
        final int maxTimeBetweenAttemptsInSec = 60 * 15; // max 15 minutes.

        return upstream -> upstream
            // Split error into empty value + error, as
            // - we want the outer stream to have an empty
            //   _channel event in case of connection failure so
            //   it can fallback to local storage for instance.
            // - using error + retryWhen doesn't allow to emit
            //   that empty event.
            // - using startWith wont be retriggered after
            //   error recovery.
            //
            // @warning This will replay failed credentials for rabbit
            // connection because we can't differentiate credential issues from
            // connectivity ones.
            //
            // @note Observable#onErrorResumeNext requires ~ same input type as
            // output and thus doesn't seem to be able to convert type
            // (non-optional into optional).
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
                                Math.min(Double.valueOf(Math.pow(2., i)).longValue(), maxTimeBetweenAttemptsInSec),
                                TimeUnit.SECONDS
                            )
                    )
            )
            .doOnEach(event -> {
                Log.d("Phenotype", event.toString()); // @todo out
            })
            // Prevent empty observable being retriggered at
            // each new attempt when connection is failing.
            .distinctUntilChanged();
    }

    public static @NonNull
    <T> ObservableTransformer<Optional<T>, Optional<T>> RefCountPipe() {
        return upstream -> upstream
            // Prevent multiple subscription to generate multiple connection (
            // thus share the rabbitmq connection across listeners through
            // reference counting) while buffering the last result to be send
            // everytime it is being subscribed to so listener directly retrieve
            // the connection status, without having to wait for a change after
            // subscription.
            // cf. https://www.baeldung.com/rxjava-multiple-subscribers-observable
            // cf. https://stackoverflow.com/questions/43859499/cache-last-emitted-item-rxjava-operator
            .replay(1)
            .refCount();
    }


    public static @NonNull
    ObservableTransformer<Optional<Connection>, Optional<Channel>> ChannelPipe(String exchangeName) {
        return upstream -> upstream
            .switchMap(optionalConnection -> {
                if (!optionalConnection.isPresent()) {
                    // Forward empty channel if no connection is set.
                    return Observable.just(Optional.empty());
                }
                else {
                    final @NonNull Connection connection = optionalConnection.get();

                    // Try to forward new channel.
                    Observable<Channel> channelStream = Observable.<Channel>create(producer -> {
                        try {
                            // Create channel.
                            //
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

                            // Close listeners and channel on dispose.
                            producer.setCancellable(() -> {
                                // Cleanup listener.
                                channel.removeShutdownListener(shutdownListener);

                                // Close channel.
                                if (channel.isOpen()) {
                                    channel.close();
                                }
                            });

                            // Register listeners.
                            channel.addShutdownListener(shutdownListener);

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
                            // RabbitChannel.
                            channel.exchangeDeclarePassive(exchangeName);

                            // @note
                            // Message publish confirmation is disabled by default.
                            // cf. https://www.rabbitmq.com/tutorials/tutorial-seven-java.html

                            // Forward channel to stream.
                            if (!producer.isDisposed()) {
                                producer.onNext(channel);
                            }
                        }
                        // Forward network exception to stream.
                        catch (IOException exc) {
                            if (!producer.isDisposed()) {
                                producer.onError(exc);
                            }
                        }
                    });

                    return channelStream
                        // Observable#onErrorResumeNext, used by RetryPipe,
                        // requires ~ same input type as output.
                        .map(Optional::of)
                        // Retry in case of error, with exponential backoff,
                        // potentially due to exchange not yet declared server
                        // side, see #exchangeDeclarePassive related comments
                        // above.
                        .compose(RetryPipe());
                }
            });
    }

    public static @NonNull
    ObservableTransformer<Optional<Channel>, Optional<RabbitAdapter>> AdapterPipe(RabbitModel model) {
        return upstream -> upstream
            .map(optionalChannel -> {
                if (!optionalChannel.isPresent()) {
                    // Forward empty model if adapter is set.
                    return Optional.empty();
                }
                else {
                    // Forward adapter otherwise.
                    Channel channel = optionalChannel.get();
                    RabbitAdapter adapter = new RabbitAdapter(channel, model);

                    return Optional.of(adapter);
                }
            });
    }
}
