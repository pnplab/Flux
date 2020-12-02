package org.pnplab.flux.restingstatetask.model;

import android.bluetooth.BluetoothAdapter;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;

import org.pnplab.flux.utils.Function;

public class BluetoothManager {

    private Function _onBluetoothStateChanged;

    public BluetoothManager() {

    }

    // Return bluetooth current status.
    public boolean isBluetoothEnabled() {
        BluetoothAdapter bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
        return bluetoothAdapter.isEnabled();
    }

    // Start listening to bluetooth status changes.
    public void listenBluetoothStateChange(Context context, Function onChange) {
        assert _onBluetoothStateChanged == null;

        // WritableStore listener method reference.
        _onBluetoothStateChanged = onChange;

        // Listen to bluetooth change broadcasts.
        IntentFilter filter = new IntentFilter(BluetoothAdapter.ACTION_STATE_CHANGED);
        context.registerReceiver(_bluetoothStateChanged, filter);
    }

    // Stop listening to bluetooth status changes.
    public void unlistenBluetoothStateChange(Context context) {
        assert _onBluetoothStateChanged != null;

        // Dispose broadcast receiver.
        context.unregisterReceiver(_bluetoothStateChanged);

        // Clear listener method reference.
        _onBluetoothStateChanged = null;
    }

    // Enable bluetooth.
    // @pre Require BLUETOOTH_ADMIN permission.
    public void enableBluetooth() {
        BluetoothAdapter bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
        bluetoothAdapter.enable();
    }

    // Bluetooth state listener.
    BroadcastReceiver _bluetoothStateChanged = new BroadcastReceiver() {
       @Override
       public void onReceive(Context context, Intent intent) {
           final String action = intent.getAction();

           assert action != null;

           // Prevent bad reference access. This is done for safety, as I am not sure context
           // broadcast registering/unregistering is done synchronously or not.
           if (_onBluetoothStateChanged == null) {
               return;
           }

           // Broadcast change to user's listener method if relevent.
           if (action.equals(BluetoothAdapter.ACTION_STATE_CHANGED)) {
               final int state = intent.getIntExtra(BluetoothAdapter.EXTRA_STATE, BluetoothAdapter.ERROR);
               switch (state) {
                   case BluetoothAdapter.STATE_OFF:
                       _onBluetoothStateChanged.apply();
                       break;
                   case BluetoothAdapter.STATE_TURNING_OFF:
                       // Do nothing...
                       break;
                   case BluetoothAdapter.STATE_ON:
                       _onBluetoothStateChanged.apply();
                       break;
                   case BluetoothAdapter.STATE_TURNING_ON:
                       // Do nothing...
                       break;
               }
           }
       }
    };
}
