package org.pnplab.phenotype.synchronization.remote;

import android.os.NetworkOnMainThreadException;
import android.util.Log;

import com.rabbitmq.client.BlockedListener;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
import com.rabbitmq.client.ShutdownListener;

import java.io.IOException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import io.reactivex.rxjava3.core.Observable;
import java9.util.Optional;

public class RabbitConnection {

    public static class Credentials {
        public final String userId;
        public final String password;

        public Credentials(String userId, String password) {
            this.userId = userId;
            this.password = password;
        }
    }

    // Reference-counted rabbitmq connection. Retriggers at subscribe.
    //
    // @warning
    // This generates a new connection at each call, but multiple subscription
    // to the subsequent stream does not recreate the connection
    //
    // @warning
    // Although doable w/ server-side config, we do not separate connectivity
    // failures from credential failure. Thus this will retry to connect
    // indefinitely even if the issue comes from the credentials, and it won't
    // be possible to detect it.
    // cf. https://www.rabbitmq.com/auth-notification.html
    public static Observable<Optional<Connection>> streamAndRetryOnFailure(final Credentials credentials) {
        return Observable
        // Send channel object or null while awaiting reconnection.
        // If connection fails on first attempt, stream exception instead.
        .<Optional<Connection>>create(emitter -> {
            try {
                // Connect to rabbitmq server.
                // https://issuetracker.google.com/issues/36916900#comment18
                // https://issuetracker.google.com/issues/36972829
                ConnectionFactory factory = new ConnectionFactory();
                factory.setHost("192.99.152.104");
                factory.setPort(5672);
                // @note
                // inheriting credentials from CredentialsProvider and
                // relying on setCredentialsProvider forces us to expose the
                // rabbitmq lib interface to end user if they use this class,
                // thus we user setUsername and setPassword instead.
                factory.setUsername(credentials.userId);
                factory.setPassword(credentials.password);
                // Set automatic recovery to false as
                // - it only starts working after connection has first been
                //   established.
                // - we already have exponential backoff recovery implemented
                //   within our rxjava client code.
                // @note true is default value.
                factory.setAutomaticRecoveryEnabled(false);

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
                final Connection connection = factory.newConnection(credentials.userId);

                // Forward disconnection events.
                ShutdownListener shutdownListener = cause -> {
                    if (!emitter.isDisposed()) {
                        emitter.onError(cause);
                    }
                };
                connection.addShutdownListener(shutdownListener);

                // Forward suspension events (due to server resources (cpu, i/o,
                // ...) overwhelmed for instance).
                // cf. https://www.rabbitmq.com/connection-blocked.html#notifications
                BlockedListener blockedListener = new BlockedListener() {
                    @Override
                    public void handleBlocked(String reason) throws IOException {
                        if (!emitter.isDisposed()) {
                            emitter.onNext(Optional.empty());
                        }
                    }

                    @Override
                    public void handleUnblocked() throws IOException {
                        if (!emitter.isDisposed()) {
                            emitter.onNext(Optional.of(connection));
                        }
                    }
                };
                connection.addBlockedListener(blockedListener);

                // Forward recovery events.
                /*
                commented out as always false.

                boolean isAutomaticRecoveryEnabled = factory.isAutomaticRecoveryEnabled(); // default is true.
                if (isAutomaticRecoveryEnabled) {
                    AutorecoveringConnection autoRecoveringConnection = (AutorecoveringConnection) connection;
                    autoRecoveringConnection.addRecoveryListener(new RecoveryListener() {

                        @Override
                        public void handleRecovery(Recoverable recoverable) {
                            if (!emitter.isDisposed()) {
                                emitter.onNext(Optional.of(connection));
                            }
                        }

                        @Override
                        public void handleRecoveryStarted(Recoverable recoverable) {
                            // ... do nothing.
                        }

                    });
                }
                */

                // Close listeners + connection on rxjava subscription disposed.
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

                // Forward current connection.
                if (!emitter.isDisposed()) {
                    emitter.onNext(Optional.of(connection));
                }
            }
            // For connection timeout.
            catch (TimeoutException e) {
                if (!emitter.isDisposed()) {
                    emitter.onError(new RuntimeException("RabbitMQ connection has failed due to timeout."));
                }
            }
            // For connection failure (and disconnection/broken channel at other places).
            catch (IOException e) {
                if (!emitter.isDisposed()) {
                    emitter.onError(new RuntimeException(e));
                }
            }
            // For rxjava subscription on main thread.
            catch (NetworkOnMainThreadException e) {
                if (!emitter.isDisposed()) {
                    emitter.onError(new RuntimeException(e));
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
        //
        // @warning This will replay failed credentials because we can't
        // differentiate credential issues from connectivity ones.
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
        .distinctUntilChanged()
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

    /*
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

                // Assert the data exchange already exists or throw
                // IOException.
                //
                // Topic exchanges allow to use regexp to route multiple
                // specific message routing keys to more general queues, in our
                // case user-specific routing keys to any-user global queues).
                //
                // Our data exchange is a topic exchange used to be able to
                // have fine-grained user permission (global any userId consume
                // permission with user specific publish permission).
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
                // interpreted by rxjava retry operator).
                channel.exchangeDeclarePassive("data");

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
    */
}
