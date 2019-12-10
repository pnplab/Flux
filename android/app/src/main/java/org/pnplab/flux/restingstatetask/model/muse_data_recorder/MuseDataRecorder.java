package org.pnplab.flux.restingstatetask.model.muse_data_recorder;

import com.bugsnag.android.Bugsnag;
import com.choosemuse.libmuse.Eeg;
import com.choosemuse.libmuse.Muse;

import org.pnplab.flux.utils.IProcessPriorityPromoter;

public class MuseDataRecorder {
    private final MuseDataRepository _museDataRepository;
    private final IProcessPriorityPromoter _backgroundStatePromoter;
    private MuseDataCircularBuffer _museDataCircularBuffer;

    public MuseDataRecorder(MuseDataRepository museDataRepository, IProcessPriorityPromoter backgroundStatePromoter) {
        _museDataRepository = museDataRepository;
        _backgroundStatePromoter = backgroundStatePromoter;
    }

    public void startRecording(final String awareDeviceId, Muse museDevice) {
        assert _museDataCircularBuffer == null;

        // Make sure circular buffer will be kept running even if user stop the app.
        _backgroundStatePromoter.promoteProcessToBackgroundState();

        // Start recording muse data into circular buffer.
        _museDataCircularBuffer = new MuseDataCircularBuffer();
        _museDataCircularBuffer.startDeviceDataRecording(
            museDevice,
            museDataPacket -> {
                // @warning this method is executed from another thread.
                // _museDataRepository and awareDeviceId access must be kept
                // threadsafe!

                // Ignore packet recording if packet is null.
                // Fixes app crash due to `Attempt to invoke virtual method
                // 'long com.choosemuse.libmuse.MuseDataPacket.timestamp()' on
                // a null object reference`. cf. https://github.com/pnplab/Flux/issues/3.
                // Happen rarely. May be due to muse disconnection. We prevent
                // the app crash but stop storing the eeg data though. We still
                // log the issue in bugsnag. The video will keep going and user
                // wont notice. Perhaps best to lose data than to restart since
                // we don't want to bother the user too much in order to avoid
                // churn.
                // @todo Decide whether ask the user to restart the task or not.
                if (museDataPacket == null) {
                    Bugsnag.notify(new RuntimeException("Trying to store null muse data packet"));
                    return;
                }

                // Retrieve values out of the packet.
                long museTimestamp = museDataPacket.timestamp();
                long phoneTimestamp = System.currentTimeMillis();
                double eegChannel1 = museDataPacket.getEegChannelValue(Eeg.EEG1);
                double eegChannel2 = museDataPacket.getEegChannelValue(Eeg.EEG1);
                double eegChannel3 = museDataPacket.getEegChannelValue(Eeg.EEG1);
                double eegChannel4 = museDataPacket.getEegChannelValue(Eeg.EEG1);

                // Record values in repository.
                _museDataRepository.insertDataPoint(awareDeviceId,
                    museTimestamp, phoneTimestamp, eegChannel1, eegChannel2,
                    eegChannel3, eegChannel4);
        });
    }

    public void stopRecording() {
        assert _museDataCircularBuffer != null;
        
        // Stop recording data and unpromote the app from background state once
        // the circular buffer processing is done.
        // @warning this method is executed from another thread. Content must
        //     be threadsafe.
        _museDataCircularBuffer.stopDeviceDataRecording(_backgroundStatePromoter::unpromoteProcessFromBackgroundState);
        _museDataCircularBuffer = null;
    }
}
