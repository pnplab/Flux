package org.pnplab.flux.restingstatetask.model;

import android.os.Build;

import androidx.test.ext.junit.runners.AndroidJUnit4;

import com.choosemuse.libmuse.ConnectionState;
import com.choosemuse.libmuse.Muse;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.pnplab.flux.TestApplication;
import org.robolectric.annotation.Config;

import java.util.concurrent.atomic.AtomicReference;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

@RunWith(AndroidJUnit4.class)
@Config(sdk = Build.VERSION_CODES.O_MR1, application = TestApplication.class)
public class TestMuseAutoConnection {

    private MuseDeviceListObserverMock _museDeviceListObserver;
    private MuseDeviceManagerMock _museDeviceManager;
    private MuseAutoConnection _museAutoConnection;

    @Before
    public void setUp() throws Exception {
        _museDeviceListObserver = new MuseDeviceListObserverMock();
        _museDeviceManager = new MuseDeviceManagerMock();
        _museAutoConnection = new MuseAutoConnection(_museDeviceListObserver, _museDeviceManager);
    }

    @Test
    public void shouldTryToConnectToTheFirstDeviceAvailable() throws Exception {
        // Given auto connection is not yet started.
        assertFalse(_museAutoConnection.isConnectionAttemptOngoingOrHaveSucceed());

        // When we start muse auto connection.
        AtomicReference<ConnectionState> _connectionStatus = new AtomicReference<>(ConnectionState.UNKNOWN);
        _connectionStatus.set(_museDeviceManager.getConnectionState());
        _museAutoConnection.start((connectionStatus) -> _connectionStatus.set(connectionStatus));
        assertTrue(_museAutoConnection.isConnectionAttemptOngoingOrHaveSucceed());

        // Then the algo should be looking for devices.
        assertTrue(_museDeviceListObserver.mock.isListening());

        // Given a device has been found.
        _museDeviceListObserver.mock.fillDeviceList();
        Muse firstDevice = _museDeviceListObserver.getFirstDevice();

        // Then the algo should no longer look for other muse.
        assertFalse(_museDeviceListObserver.mock.isListening());

        // Then the algo should try to connect to the first muse of the list.
        Muse managedDevice = _museDeviceManager.mock.getManagedDevice();
        assertNotNull(firstDevice);
        assertNotNull(managedDevice);
        assertEquals(firstDevice, managedDevice);
        assertTrue(_museDeviceManager.mock.isTryingToConnect());

        // Then, the device should be connecting.
        assertEquals(_connectionStatus.get(), ConnectionState.CONNECTING);

        // Given the connection succeed.
        _museDeviceManager.mock.succeedConnection();

        // Then the device should be connected.
        assertEquals(_connectionStatus.get(), ConnectionState.CONNECTED);
    }

    @Test
    public void shouldRestartConnectionOnConnectionFailureWhenNoDevicesAreAvailableAnymore() throws Exception {
        // When we start muse auto connection.
        AtomicReference<ConnectionState> _connectionStatus = new AtomicReference<>(ConnectionState.UNKNOWN);
        _connectionStatus.set(_museDeviceManager.getConnectionState());
        _museAutoConnection.start((connectionStatus) -> {
            _connectionStatus.set(connectionStatus);
        });

        // Given we provide muse to connect to.
        _museDeviceListObserver.mock.fillDeviceList();
        Muse firstDevice = _museDeviceListObserver.getFirstDevice();

        // Given connection fails and there is no longer device available for connection.
        _museDeviceListObserver.mock.clearDeviceList();
        _museDeviceManager.mock.failConnection();

        // Then, the device should be disconnected.
        assertEquals(_connectionStatus.get(), ConnectionState.DISCONNECTED);

        // Then, the algo should start looking for devices again.
        assertTrue(_museDeviceListObserver.mock.isListening());

        // Given devices are available...
        _museDeviceListObserver.mock.fillDeviceList();
        Muse firstDevice2 = _museDeviceListObserver.getFirstDevice();

        // Then, the algo should retry to connect to first device in list.
        Muse managedDevice = _museDeviceManager.mock.getManagedDevice();
        assertNotNull(firstDevice);
        assertNotNull(firstDevice2);
        assertNotNull(managedDevice);
        assertNotEquals(firstDevice, managedDevice);
        assertEquals(firstDevice2, managedDevice);
        assertTrue(_museDeviceManager.mock.isTryingToConnect());

        // Then, the device should be connecting.
        assertEquals(_connectionStatus.get(), ConnectionState.CONNECTING);
    }

    @Test
    public void shouldRestartConnectionOnConnectionFailureWhenDevicesAreStillAvailable() throws Exception {
        // When we start muse auto connection.
        AtomicReference<ConnectionState> _connectionStatus = new AtomicReference<>(ConnectionState.UNKNOWN);
        _connectionStatus.set(_museDeviceManager.getConnectionState());
        _museAutoConnection.start((connectionStatus) -> {
            _connectionStatus.set(connectionStatus);
        });

        // Given we provide muse to connect to.
        _museDeviceListObserver.mock.fillDeviceList();
        Muse firstDevice = _museDeviceListObserver.getFirstDevice();

        // Given connection fails and there is still devices available for connection.
        _museDeviceManager.mock.failConnection();

        // Then, the algo should not start looking for device again.
        assertFalse(_museDeviceListObserver.mock.isListening());

        // Then, the algo should retry to connect to the same device as before.
        Muse managedDevice = _museDeviceManager.mock.getManagedDevice();
        assertEquals(firstDevice, managedDevice);
        assertTrue(_museDeviceManager.mock.isTryingToConnect());

        // Then, the device should be connecting (actually it should be disconnected, but it will
        // be set back to CONNECTING instantaneously due to the synchronous mocking).
        assertEquals(_connectionStatus.get(), ConnectionState.CONNECTING);
    }

}
