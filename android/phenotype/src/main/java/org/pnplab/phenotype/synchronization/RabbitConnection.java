package org.pnplab.phenotype.synchronization;

import android.os.NetworkOnMainThreadException;

import com.rabbitmq.client.BlockedListener;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
import com.rabbitmq.client.Recoverable;
import com.rabbitmq.client.RecoveryListener;
import com.rabbitmq.client.ShutdownSignalException;
import com.rabbitmq.client.impl.recovery.AutorecoveringConnection;

import org.pnplab.phenotype.system.entrypoints.AbstractPhenotypeInitProvider;

import java.io.IOException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import io.reactivex.rxjava3.core.Observable;
import java9.util.Optional;

public class RabbitConnection {

    private static Observable<Optional<Channel>> _connectionStream = Observable
        // Send channel object or null while awaiting reconnection.
        // If connection fails on first attempt, stream exception instead.
        .<Optional<Channel>>create(emitter -> {
            try {
                // Connect to rabbitmq server.
                // https://issuetracker.google.com/issues/36916900#comment18
                // https://issuetracker.google.com/issues/36972829
                ConnectionFactory factory = new ConnectionFactory();
                factory.setHost("192.99.152.104");
                factory.setPort(5672);
                factory.setPassword("guest");
                factory.setUsername("guest");
                // Set automatic recovery to false as
                // - it only starts working after connection has first been
                //   established.
                // - we already have exponential backoff recovery implemented
                //   within our rxjava client code.
                // @note true is default value.
                factory.setAutomaticRecoveryEnabled(false);
                // factory.setPassword("hoho");

                // Start connection attempt.
                Connection connection = factory.newConnection();

                // Close connection on rxjava subscription disposed.
                emitter.setCancellable(() -> {
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

                // Continue channel creation.
                // @note
                // Will be recreated automatically by rabbitmq in case of
                // failure recovery, which is not the case in our code).
                Channel channel = connection.createChannel();

                // @note
                // Before publishing data, queue have to be declared in the
                // channel. This responsibility is delegated to store for now.

                // Forward disconnection events.
                connection.addShutdownListener((ShutdownSignalException cause) -> {
                    if (!emitter.isDisposed()) {
                        emitter.onNext(Optional.empty());
                    }
                });

                // Forward recovery events.
                boolean isAutomaticRecoveryEnabled = factory.isAutomaticRecoveryEnabled(); // default is true.
                if (isAutomaticRecoveryEnabled) {
                    AutorecoveringConnection autoRecoveringConnection = (AutorecoveringConnection) connection;
                    autoRecoveringConnection.addRecoveryListener(new RecoveryListener() {

                        @Override
                        public void handleRecovery(Recoverable recoverable) {
                            if (!emitter.isDisposed()) {
                                emitter.onNext(Optional.of(channel));
                            }
                        }

                        @Override
                        public void handleRecoveryStarted(Recoverable recoverable) {
                            // ... do nothing.
                        }

                    });
                }

                // Forward suspension events (due to server resources (cpu, i/o,
                // ...) overwhelmed for instance).
                // cf. https://www.rabbitmq.com/connection-blocked.html#notifications
                connection.addBlockedListener(new BlockedListener() {
                    @Override
                    public void handleBlocked(String reason) throws IOException {
                        if (!emitter.isDisposed()) {
                            emitter.onNext(Optional.empty());
                        }
                    }

                    @Override
                    public void handleUnblocked() throws IOException {
                        if (!emitter.isDisposed()) {
                            emitter.onNext(Optional.of(channel));
                        }
                    }
                });

                // Forward current connection channel.
                if (!emitter.isDisposed()) {
                    emitter.onNext(Optional.of(channel));
                }
            }
            // For connection timeout.
            catch (TimeoutException e) {
                if (!emitter.isDisposed()) {
                    emitter.onError(new RuntimeException("RabbitMQ connection has failed due to timeout."));
                }
            }
            // For disconnection and connection failure.
            catch (IOException e) {
                if (!emitter.isDisposed()) {
                    emitter.onError(new RuntimeException(e));
                }
            }
            catch (NetworkOnMainThreadException e) {
                if (!emitter.isDisposed()) {
                    emitter.onError(new RuntimeException(e));
                }
            }
        })
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

    // Reference-counted rabbitmq connection. Retriggers at subscribe.
    public static Observable<Optional<Channel>> stream() {
        return _connectionStream;
    }

    // Try to provide rabbit mq connection, or empty item in case of failure
    // (as well as delayed broken connection).
    private static Observable<Optional<Channel>> _connectionStreamWithRetry = _connectionStream
        // Split error into empty value + error, as
        // - we want the outer stream to have an empty
        //   _channel event in case of connection failure so
        //   it can fallback to local storage for instance.
        // - using error + retryWhen doesn't allow to emit
        //   that empty event.
        // - using startWith wont be retriggered after
        //   error recovery.
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
                            Math.max(Double.valueOf(Math.pow(2., i)).longValue(), 60 * 15),
                            TimeUnit.SECONDS
                        )
                )
        )
        .doOnEach(event -> {
            AbstractPhenotypeInitProvider.getLogger().v(event.toString());
        })
        // Prevent empty observable being retriggered at
        // each new attempt when connection is failing.
        .distinctUntilChanged()
        // Reference count subscriptions, such as we avoid multiple
        // reconnection (this is only a slight optimization, since this
        // optimisation is already achieved at _connectionStream level).
        // @todo check how both retryWhen and multithreading works in multi
        //  threading env.
        .replay(1)
        .refCount();

    // Reference-counted rabbitmq connection w/ exponential-backoff retry
    // algorithm (max 15min). Retriggers at subscribe.
    public static Observable<Optional<Channel>> streamAndRetryOnFailure() {
        return _connectionStreamWithRetry;
    }
}
