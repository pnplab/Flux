package org.pnplab.flux.restingstatetask.components;

import com.aware.Aware;
import com.aware.Aware_Preferences;
import com.choosemuse.libmuse.ConnectionState;
import com.choosemuse.libmuse.Muse;
import com.facebook.react.bridge.ReactApplicationContext;

import org.pnplab.flux.restingstatetask.model.MuseDeviceManager;
import org.pnplab.flux.restingstatetask.model.muse_data_recorder.MuseDataRecorder;
import org.pnplab.flux.restingstatetask.model.muse_data_recorder.MuseDataRepository;
import org.pnplab.flux.utils.IProcessPriorityPromoter;

public class VideoScreen {

    private final ReactApplicationContext _context;
    private final MuseDeviceManager _museDeviceManager;
    private final MuseDataRecorder _museDataRecorder;

    public VideoScreen(ReactApplicationContext context,
                       MuseDataRepository museDataRepository,
                       MuseDeviceManager museDeviceManager,
                       IProcessPriorityPromoter backgroundStatePromoter
    ) {
        _context = context;

        _museDeviceManager = museDeviceManager;
        _museDataRecorder = new MuseDataRecorder(museDataRepository, backgroundStatePromoter);

        // @todo Monitor muse connection status and trigger video cancelation in case of change. Remove callback from museAutoConnection
        // Bypass task on issue -> user frustration could influence results.
    }

    public void onVideoStreamStarted() {
        // Muse must be connected at the time video start! This constaint is ensured by javascript.
        // Due to javascript bridge asynchronicity, it's possible this constraint is broken. For
        // such case, we double check all states.
        if (_museDeviceManager.getConnectionState() != ConnectionState.CONNECTED) {
            // @todo Send an event instead of throwing an error.
            throw new RuntimeException("Muse is no longer connected");
        }

        // Start recording muse data.
        Muse museDevice = _museDeviceManager.getManagedDevice();
        String awareDeviceId = Aware.getSetting(_context, Aware_Preferences.DEVICE_ID);
        _museDataRecorder.startRecording(awareDeviceId, museDevice);

        // ... Video view control flow is handled through JS.
    }

    public void onVideoStreamFinished() {
        // Stop (and store) recording.
        _museDataRecorder.stopRecording();

        // Disconnect device.
        _museDeviceManager.disconnectDevice();

        // ... Video view control flow is handled through JS.
    }

    public void onVideoLoadingError() {
        // Disconnect device.
        _museDeviceManager.disconnectDevice();

        // ... Video error control flow is handled through JS.
    }

}
