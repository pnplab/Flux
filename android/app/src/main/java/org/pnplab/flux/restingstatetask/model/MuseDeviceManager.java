package org.pnplab.flux.restingstatetask.model;

import android.util.Log;

import com.choosemuse.libmuse.ConnectionState;
import com.choosemuse.libmuse.Muse;
import com.choosemuse.libmuse.MuseConnectionListener;
import com.choosemuse.libmuse.MuseConnectionPacket;

import org.pnplab.flux.utils.FunctionIn1;

import java.lang.ref.WeakReference;

public class MuseDeviceManager extends MuseConnectionListener implements IMuseDeviceManager {

    private Thread _museThread;
    private FunctionIn1<ConnectionState> _onConnectionStatusChangedFn;
    private Muse _managedDevice;

    private static final String TAG = "Flux";

    public void setManagedDevice(Muse device) {
        _managedDevice = device;
    }

    // This starts a new thread to handle muse bluetooth interface and initiate a connection.
    // @warning This triggers a thread race condition if called after a muse DISCONNECTED event (
    //          that could happen in order to automatically reconnect the muse after disconnection).
    public void connectDevice(FunctionIn1<ConnectionState> onConnectionStatusChanged) {
        Log.v(TAG, "MuseDeviceManager#connectDevice");

        // Ensure a muse has been set.
        assert _managedDevice != null;

        // Check if there is already an handler set.
        assert _onConnectionStatusChangedFn != null;

        // Connect the muse a muse execution thread.
        // That will registerConnectionListener
        _managedDevice.registerConnectionListener(MuseDeviceManager.this);
        _museThread = new MuseDeviceExecutionThread(new WeakReference<>(_managedDevice));
        _museThread.start();

        // Store callback in order to be able to call it whenever muse connection status changes.
        _onConnectionStatusChangedFn = onConnectionStatusChanged;
    }

    public void disconnectDevice() {
        Log.v(TAG, "MuseDeviceManager#disconnectDevice");

        // Remove connection status event handler.
        _onConnectionStatusChangedFn = null;

        // Disconnect the muse and cleanup listeners.
        if (_managedDevice != null) {
            // Disconnect device.
            // @note #disconnect will trigger disconnection event even if the event is unregistered
            // just after the call. Both methods are thread safe in that regards according to doc!
            _managedDevice.disconnect();
            _managedDevice.unregisterConnectionListener(this);

            // Cleanup all listeners.
            // @todo remove. Even if this make sense, this is dirty. Cleaner to unregister listener
            //       one by one. To do so, the current class should probably trigger
            //       onConnectionStatusChanged manually (since we've just unregistered the
            //       connection status listener) and let the subclasses handle the disconnection
            //       properly and unregister their listeners. They probably have more stuff to do.
            _managedDevice.unregisterAllListeners();
            _managedDevice = null;
        }

        // Stop the thread.
        if (_museThread != null) {
            // @note Muse#disconnect is enough to stop the thread safely when using
            // Muse#runAsynchronously. No need to call for unsafe Thread#stop. Thus we just clear
            // the thread reference.
            _museThread = null;
        }
    }

    public ConnectionState getConnectionState() {
        Muse device = this._managedDevice;

        // If there is a muse device currently managed by this class in order to handle its
        // connection, return its current connection status. If there is simply no muse managed at
        // all, always return disconnected.
        if (device == null) {
            return ConnectionState.DISCONNECTED;
        }
        else {
            return device.getConnectionState();
        }
    }

    public Muse getManagedDevice() {
        return _managedDevice;
    }

    @Override
    public void receiveMuseConnectionPacket(MuseConnectionPacket museConnectionPacket, Muse muse) {
        Log.v(TAG, "MuseDeviceManager#receiveMuseConnectionPacket");

        _onConnectionStatusChangedFn.apply(museConnectionPacket.getCurrentConnectionState());
    }

}
