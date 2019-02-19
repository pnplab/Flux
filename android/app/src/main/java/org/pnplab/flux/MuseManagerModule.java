package org.pnplab.flux;

import android.bluetooth.BluetoothAdapter;
import android.os.Handler;
import android.os.HandlerThread;
import android.support.annotation.Nullable;
import android.util.Log;

import com.choosemuse.libmuse.ConnectionState;
import com.choosemuse.libmuse.Muse;
import com.choosemuse.libmuse.MuseConnectionListener;
import com.choosemuse.libmuse.MuseConnectionPacket;
import com.choosemuse.libmuse.MuseListener;
import com.choosemuse.libmuse.MuseManagerAndroid;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.List;

public class MuseManagerModule extends ReactContextBaseJavaModule {

    private MuseListener museL;
    private MuseManagerAndroid manager;
    private MuseManagerModule.ConnectionListener connectionListener;
    private int museIndex = 0;
    private List<Muse> availableMuses;
    private Muse muse;
    private boolean isBluetoothEnabled;
    public Handler connectHandler;
    public HandlerThread connectThread;

    private Muse connectedMuse;

    public MuseManagerModule(ReactApplicationContext reactContext) {
        super(reactContext);

        // MuseManagerAndroid must be created and given context before any LibMuse calls can be made
        // In a React Native app, we get context through getReactApplicationContext.
        // However, if this was a pure Android app it would be setContext(this)
        manager = MuseManagerAndroid.getInstance();
        manager.setContext(reactContext);
        manager.removeFromListAfter(1);

        museL = new MuseManagerModule.MuseL();
        manager.setMuseListener(museL);
    }

    @Override
    public String getName() {
        return "MuseManager";
    }

    @ReactMethod
    public void checkBluetooth() {
        String BLUETOOTH_DISABLED = "BLUETOOTH_DISABLED";
        String BLUETOOTH_ENABLED = "BLUETOOTH_ENABLED";

        if (!checkBluetoothEnabled()) {
            WritableMap params = Arguments.createMap();
            _sendEvent(BLUETOOTH_DISABLED, params);
        }
        else {
            WritableMap params = Arguments.createMap();
            _sendEvent(BLUETOOTH_ENABLED, params);
        }
    }

    // Starts the LibMuse MuseManagerAndroid class and creates a Muse Listener
    @ReactMethod
    public void startListeningMuseList() {
        // Register a listener to receive notifications of what Muse headbands
        // we can connect to.
        manager.startListening();
    }

    @ReactMethod
    public void stopListeningMuseList() {
        manager.stopListening();
    }

    @ReactMethod
    public void startListeningConnectionStatus() {
        // Creates a ConnectionListener, HandlerThread, and Handler for connecting to Muses
        // Sending connectionAttempts to a HandlerThread is a good idea because they're fundamentally asynchronous

        if (connectionListener == null) {
            // Register a listener to receive connection state changes.
            connectionListener = new MuseManagerModule.ConnectionListener();
        }

        // Create the HandlerThread that will handle queueing of connection attempts
        connectThread = new HandlerThread("connectThread");
        connectThread.start();
        connectHandler = new Handler(connectThread.getLooper());
    }
    @ReactMethod
    public void stopListeningConnectionStatus() {
        if (connectHandler != null) {
            // Removes all runnables and things from the Handler
            connectHandler.removeCallbacksAndMessages(null);
            connectThread.quit();

            connectHandler = null;
            connectThread = null;
        }
    }

    class MuseL extends MuseListener {
        String MUSE_LIST_CHANGED = "MUSE_LIST_CHANGED";

        @Override
        public void museListChanged() {
            availableMuses = manager.getMuses();

            // Only need to execute this code if in React Native app to send info about available Muses
            _sendEvent(MUSE_LIST_CHANGED, getWritableMuseList(availableMuses));
        }
    }

    // Notified whenever connection state of its registered Muse changes
    class ConnectionListener extends MuseConnectionListener {
        String CONNECTION_CHANGED = "CONNECTION_CHANGED";

        WritableMap museMap;

        @Override
        public void receiveMuseConnectionPacket(final MuseConnectionPacket p, final Muse muse) {
            final ConnectionState current = p.getCurrentConnectionState();
            if (current == ConnectionState.CONNECTED) {

                // Set connected muse to a Singleton in appState so it can be accessed from anywhere
                connectedMuse = muse;
                // @warning We stop listening from JS code. This is mandatory!
                // stopListening();

                // Only need to execute this code if in React Native app to send info about connected Muse
                // Creates a Map with connectionStatus and info about the Muse to send to React Native
                museMap = Arguments.createMap();
                museMap.putString("connectionStatus", "CONNECTED");
                museMap.putString("name", muse.getName());
                if (muse.isLowEnergy()) {
                    museMap.putString("model", "2016");
                } else {
                    museMap.putString("model", "2014");
                }
                _sendEvent(CONNECTION_CHANGED, museMap);
                return;
            }

            if (current == ConnectionState.DISCONNECTED) {
                museMap = Arguments.createMap();
                museMap.putString("connectionStatus", "DISCONNECTED");
                _sendEvent(CONNECTION_CHANGED, museMap);

            }
            if (current == ConnectionState.CONNECTING) {
                museMap = Arguments.createMap();
                museMap.putString("connectionStatus", "CONNECTING");
                _sendEvent(CONNECTION_CHANGED, museMap);
            }
        }
    }

    @ReactMethod
    public void connectMuse(Integer index) {
        museIndex = index;

        // Queue one Muse search attempt
        connectHandler.post(connectRunnable);
    }

    @ReactMethod
    public void disconnectMuse() {
        if (connectedMuse != null) {
            connectedMuse.disconnect();
            connectedMuse.unregisterAllListeners();
            connectedMuse = null;
        }
    }

    // ------------------------------------------------------------------------------
    // Runnables

    // Attempts to connect by registering the connection Listener to the muse specified by museIndex
    // and calling runAsynchronously()

    private final Runnable connectRunnable = new Runnable() {
        @Override
        public void run() {
            try {
                muse = availableMuses.get(museIndex);

                // Unregister all prior listeners and register our ConnectionListener to the
                // Muse we are interested in. The ConnectionListener will allow us to detect
                // whether the connection attempt is successful
                muse.unregisterAllListeners();
                muse.registerConnectionListener(connectionListener);

                // Initiate a connection to the headband and stream the data asynchronously.
                // runAsynchronously() handles most of the work to connect to the Muse by itself
                muse.runAsynchronously();

            } catch (IllegalArgumentException | NullPointerException | IndexOutOfBoundsException e) {
                return;
            }
        }
    };

    // -----------------------------------------------------------------------------
    // Helper Methods

    // Convenience function to build a c of Muses to send to React Native
    public WritableArray getWritableMuseList(List<Muse> muses) {
        WritableArray museArray = Arguments.createArray();
        int index = 0;

        for (Muse muse : muses) {
            WritableMap map = Arguments.createMap();
            map.putString("name", muse.getName());
            if (muse.isLowEnergy()) {
                map.putString("model", "2016");
            } else {
                map.putString("model", "2014");
            }
            museArray.pushMap(map);
            index++;
        }

        return museArray;
    }

    public boolean checkBluetoothEnabled() {
        BluetoothAdapter bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
        isBluetoothEnabled = bluetoothAdapter.isEnabled();
        return isBluetoothEnabled;
    }

    private void _sendEvent(String eventName,
                            @Nullable WritableMap params) {
        Log.d("ReactNative", "JavaEvent: " + eventName);
        getReactApplicationContext()
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
    }

    private void _sendEvent(String eventName,
                            @Nullable WritableArray params) {
        Log.d("ReactNative", "JavaEvent: " + eventName);

        getReactApplicationContext()
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
    }

}
