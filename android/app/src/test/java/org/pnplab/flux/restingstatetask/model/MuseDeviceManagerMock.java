package org.pnplab.flux.restingstatetask.model;

import com.choosemuse.libmuse.ConnectionState;
import com.choosemuse.libmuse.Muse;

import org.pnplab.flux.utils.FunctionIn1;

public class MuseDeviceManagerMock implements IMuseDeviceManager {

    private Muse _device;
    ConnectionState _connectionState = ConnectionState.UNKNOWN;
    private FunctionIn1<ConnectionState> _onConnectionStatusChanged;

    public class Mock {
        public Muse getManagedDevice() {
            return _device;
        }

        public boolean isTryingToConnect() {
            return _onConnectionStatusChanged != null;
        }

        public void failConnection() {
            _connectionState = ConnectionState.DISCONNECTED;
            _onConnectionStatusChanged.apply(_connectionState);
        }

        public void succeedConnection() {
            _connectionState = ConnectionState.CONNECTED;
            _onConnectionStatusChanged.apply(_connectionState);
        }
    }
    public Mock mock = new Mock();

    @Override
    public void setManagedDevice(Muse device) {
        _device = device;
    }

    @Override
    public void connectDevice(FunctionIn1<ConnectionState> onConnectionStatusChanged) {
        _onConnectionStatusChanged = onConnectionStatusChanged;

        _connectionState = ConnectionState.CONNECTING;
        _onConnectionStatusChanged.apply(_connectionState);
    }

    @Override
    public void disconnectDevice() {
        _device = null;
        _onConnectionStatusChanged = null;
    }

    @Override
    public ConnectionState getConnectionState() {
        if (_device == null) {
            return ConnectionState.DISCONNECTED;
        }
        else {
            return _connectionState;
        }
    }

}
