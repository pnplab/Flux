package org.pnplab.flux.restingstatetask.model;

import android.os.Handler;
import android.util.Log;

import com.choosemuse.libmuse.ConnectionState;
import com.choosemuse.libmuse.Muse;

import org.pnplab.flux.utils.FunctionIn1;

import java.util.List;

// Algorithm to automatically connect to available muse and retry in case of failure.
public class MuseAutoConnection {

    public enum State {
        STOPPED,
        LOOKING_FOR_DEVICE,
        DEVICE_FOUND
    }

    private final IMuseDeviceManager _museDeviceManager;
    private final IMuseDeviceListObserver _museDeviceListObserver;
    private FunctionIn1<ConnectionState> _onDeviceConnectionStatusChanged;

    private State _state = State.STOPPED;

    private static final String TAG = "Flux";

    public MuseAutoConnection(IMuseDeviceListObserver museDeviceListObserver,
                              IMuseDeviceManager museDeviceManager
    ) {
        _museDeviceListObserver = museDeviceListObserver;
        _museDeviceManager = museDeviceManager;
    }
    
    // Is auto connection done or ongoing ?
    public boolean isConnectionAttemptOngoingOrHaveSucceed() {
        return _state != State.STOPPED;
    }

    // Start looking for muse devices and auto connect once found.
    // @pre Permission ACCESS_COARSE_LOCATION or ACCESS_FINE_LOCATION must be granted so muse API
    //      can scan for devices through bluetooth...
    // @warning Muse API will *not* throw any exception in case of issue. Instead, it will catch
    //      the issues without rethrowing and log it to logcat. Thus there is no way to know
    //      an issue has happened except by looking at the log...
    //      We could either:
    //      - check permission was granted but that implies passing by a context object to this
    //        class thus making testing harder, or create a permission checker wrapper w/
    //        interface (but this is misleading as its behavior wont be forwarded inside muse API
    //        when testing).
    //      - Wrap the muse API with proper error handling.
    //      None of the above solution faisable nor perfect thus, just be careful using this
    //      method!
    public void start(FunctionIn1<ConnectionState> onDeviceConnectionStatusChanged) {
        Log.v(TAG, "MuseAutoConnection#start");

        _onDeviceConnectionStatusChanged = onDeviceConnectionStatusChanged;
        _museDeviceListObserver.listenDeviceListChange(this::_onDeviceListChanged);

        _state = State.LOOKING_FOR_DEVICE;
    }

    // Clean up listeners and *disconnect device* if any.
    public void cancelOrDisconnect() {
        Log.v(TAG, "MuseAutoConnection#cancelOrDisconnect");

        switch (_state) {
            case LOOKING_FOR_DEVICE:
                _museDeviceListObserver.unlistenDeviceListChange();
                break;
            case DEVICE_FOUND:
                _museDeviceManager.disconnectDevice();
                break;
        }

        _state = State.STOPPED;
    }

    // Autoconnect to device when device list changes.
    private void _onDeviceListChanged(List<Muse> devices) {
        Log.v(TAG, "MuseAutoConnection#_onDeviceListChanged");

        if (devices.size() > 0) {
            // Prevent multiple consequent connection attempts on the same device.
            _museDeviceListObserver.unlistenDeviceListChange();

            // Store current state so we can apply the appropriate listener cleanups if the
            // user cancelOrDisconnect the auto connection mechanism.
            _state = State.DEVICE_FOUND;

            // Connect to the first device that appears.
            Muse firstDevice = devices.get(0);
            _onDeviceListFoundDevice(firstDevice);
        }
    }
    // Connect to device and retry if connection aborts, start looking for new device if none is
    // available anymore.
    private void _onDeviceListFoundDevice(Muse firstDevice) {
        Log.v(TAG, "MuseAutoConnection#_onDeviceListFoundDevice");

        _museDeviceManager.setManagedDevice(firstDevice);
        _museDeviceManager.connectDevice(connectionState -> {
            Log.v(TAG, "MuseAutoConnection#_onDeviceListFoundDevice -> connected to device");

            // Propagate event. It's used by ReactModule class to propagate connection changes
            // to JS.
            // @warning it would be better design to handle multiple event listener on
            //    MuseDeviceManager instead.
            _onDeviceConnectionStatusChanged.apply(connectionState);

            // Try to reconnect if connection has aborted for some reason.
            if (connectionState.equals(ConnectionState.DISCONNECTED)) {
                // If device list is empty again, start listening to device list again.
                if (_museDeviceListObserver.isEmpty()) {
                    _museDeviceListObserver.listenDeviceListChange(this::_onDeviceListChanged);
                }
                // Otherwise, connect back to the first available device.
                else {
                    // Update the first device.
                    Muse newFirstDevice = _museDeviceListObserver.getFirstDevice();

                    // Wait for 1s then try to connect back. Indeed, there is a race condition
                    // issue in the muse API when trying to connect to a muse device from a
                    // disconnected event on two different threads.
                    Handler handler = new Handler();
                    handler.postDelayed(() -> _onDeviceListFoundDevice(newFirstDevice), 1000);
                }
            }
        });
    }

}
