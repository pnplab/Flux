package org.pnplab.flux.restingstatetask.model;

import com.choosemuse.libmuse.ConnectionState;
import com.choosemuse.libmuse.Muse;

import org.pnplab.flux.utils.FunctionIn1;

public interface IMuseDeviceManager {

    void setManagedDevice(Muse device);
    void connectDevice(FunctionIn1<ConnectionState> onConnectionStatusChanged);
    void disconnectDevice();
    ConnectionState getConnectionState();

}
