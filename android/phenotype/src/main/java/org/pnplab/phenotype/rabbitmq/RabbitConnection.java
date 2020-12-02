package org.pnplab.phenotype.rabbitmq;

import android.os.NetworkOnMainThreadException;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.rabbitmq.client.BlockedListener;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
import com.rabbitmq.client.ShutdownListener;

import java.io.IOException;
import java.util.concurrent.TimeoutException;

import kotlin.jvm.Throws;

public class RabbitConnection {

    private final @NonNull RabbitCredentials _credentials;
    private final @NonNull String _host;
    private int _port;

    public RabbitConnection(@NonNull String host, int port, @NonNull RabbitCredentials credentials) {
        this._credentials = credentials;
        this._host = host;
        this._port = port;
    }

    // @note must be cleaned up (#removeBlockedListener, #removeShutdownListener, #close).
    @Throws(
        exceptionClasses = {
            ConnectionFailureException.class,
            ConnectionTimeoutException.class,
            ConnectionOnMainThreadException.class
        }
    )
    public @NonNull Connection run(@Nullable String connectionName) {
        // Connect to rabbitmq server.
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("192.99.152.104");
        factory.setPort(5672);
        // @note
        // inheriting credentials from CredentialsProvider and
        // relying on setCredentialsProvider forces us to expose the
        // rabbitmq lib interface to end user if they use this class,
        // thus we user setUsername and setPassword instead.
        factory.setUsername(_credentials.userId);
        factory.setPassword(_credentials.password);

        // Set automatic recovery to false as
        // - it only starts working after connection has first been
        //   established.
        // - we already have exponential backoff recovery implemented
        //   within our rxjava client code.
        // @note true is default value.
        factory.setAutomaticRecoveryEnabled(false);

        // Start connection attempt.
        try {
            return factory.newConnection(connectionName);
        }
        // For connection timeout.
        catch (TimeoutException e) {
            throw new ConnectionTimeoutException(e);
        }
        // For connection failure (and disconnection/broken channel at other places).
        catch (IOException e) {
            throw new ConnectionFailureException(e);
        }
        // For subscription on main thread.
        catch (NetworkOnMainThreadException e) {
            throw new ConnectionOnMainThreadException(e);
        }
    }

    // Instantaneous connection failure.
    public static class ConnectionFailureException extends RuntimeException {
        public ConnectionFailureException(IOException e) {
            super("RabbitMQ connection has failed.", e);
        }
    }

    // Connection timeout, includes login failure with our current setup.
    public static class ConnectionTimeoutException extends RuntimeException {
        public ConnectionTimeoutException(TimeoutException e) {
            super("RabbitMQ connection has failed due to timeout.", e);
        }
    }

    // Attempt to connect to rabbitmq from the main thread.
    public static class ConnectionOnMainThreadException extends NetworkOnMainThreadException {
        public ConnectionOnMainThreadException(NetworkOnMainThreadException e) {
            super();
            initCause(e);
        }
    }
}
