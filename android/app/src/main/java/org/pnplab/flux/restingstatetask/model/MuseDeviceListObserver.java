package org.pnplab.flux.restingstatetask.model;

import android.util.Log;

import com.choosemuse.libmuse.Muse;
import com.choosemuse.libmuse.MuseListener;
import com.choosemuse.libmuse.MuseManagerAndroid;

import org.pnplab.flux.utils.FunctionIn1;

import java.util.ArrayList;
import java.util.List;

public class MuseDeviceListObserver extends MuseListener implements IMuseDeviceListObserver {

    private MuseManagerAndroid _museManagerAndroid = MuseManagerAndroid.getInstance();
    private FunctionIn1<List<Muse>> _onDeviceListChanged;

    private static final String TAG = "Flux";

    public MuseDeviceListObserver() {
        // Remove device from list as soon as they don't ping anything anymore.
        _museManagerAndroid.removeFromListAfter(1);

        // Listen to device list changes in this class.
        _museManagerAndroid.setMuseListener(this);
    }

    // @pre MuseDeviceListObserver can only have one listener at a time !
    public void listenDeviceListChange(FunctionIn1<List<Muse>> onDeviceListChanged) {
        Log.v(TAG, "MuseDeviceListObserver#listenDeviceListChange");
        assert(_onDeviceListChanged == null);

        _museManagerAndroid.startListening();
        _onDeviceListChanged = onDeviceListChanged;
    }

    public void unlistenDeviceListChange() {
        Log.v(TAG, "MuseDeviceListObserver#unlistenDeviceListChange");

        _onDeviceListChanged = null;
        _museManagerAndroid.stopListening();
    }

    public boolean isEmpty() {
        ArrayList<Muse> museList = _museManagerAndroid.getMuses();
        return museList.isEmpty();
    }

    public Muse getFirstDevice() {
        ArrayList<Muse> museList = _museManagerAndroid.getMuses();

        return museList.get(0);
    }

    @Override
    public void museListChanged() {
        Log.v(TAG, "MuseDeviceListObserver#museListChanged");

        ArrayList<Muse> museList = _museManagerAndroid.getMuses();

        if (_onDeviceListChanged == null) {
            // _onDeviceListChanged could be null if the muse api has asynchronous bugs. It's
            // unlikely, but we check it anyway for safety.
        } else {
            _onDeviceListChanged.apply(museList);
        }
    }

}
