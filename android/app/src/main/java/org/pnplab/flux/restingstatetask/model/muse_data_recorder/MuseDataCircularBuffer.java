package org.pnplab.flux.restingstatetask.model.muse_data_recorder;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;

import androidx.annotation.Nullable;

import com.choosemuse.libmuse.Eeg;
import com.choosemuse.libmuse.Muse;
import com.choosemuse.libmuse.MuseArtifactPacket;
import com.choosemuse.libmuse.MuseDataListener;
import com.choosemuse.libmuse.MuseDataPacket;
import com.choosemuse.libmuse.MuseDataPacketType;

import org.pnplab.flux.utils.ConcurrentCircularBuffer;
import org.pnplab.flux.utils.Function;
import org.pnplab.flux.utils.FunctionIn1;

// @todo record other data than raw EEG data.
public class MuseDataCircularBuffer {

    // Circular buffer, used to optimise high sampling rate recording. This is mandatory in our use
    // case as we are watching a video at the same time as we record.
    // 30 sec of sampling at 256 hz should be more than enough. This would accounts for roughly
    // 150ko considering MuseDataPacket contains 5 values of 4 bytes eaches. So we may consider
    // this holds max a few megs in memory.
    public final int CIRCULAR_BUFFER_SIZE = 256 * 30;
    private ConcurrentCircularBuffer<MuseDataPacket> _circularBuffer = null;

    public MuseDataCircularBuffer() {
        super();
    }

    // Record muse data through the defined recording method using a circular buffer.
    // @warning
    // - recordingFn and onDataProcessingFinishedCallback will be called from another thread!
    // - recordingFn may continue to be called after the lifecycle of the current object.
    //          onDataProcessingFinishedCallback will be called once the processing has finished.
    //          if recordingFn handles asynchrone process, it's up to the function user to
    //          determine recordingFn's asynchrone processes have finished as well.
    // It is therefore advised to wrap this method call inside an android component that outstands
    // the lifecycle of the Application/Activity if you call this on the main thread. This method
    // still handles threading as none of the android components are suitable for this kind of threading:
    // - Service doesn't implement threading.
    // - IntentService does implement threading but in a shared workerqueue. This will cause issues
    //   if other IntentService are running.
    // - AsyncTask has been made to interact with UI thread and I thus its lifecycle is
    //   bound to the method caller's android component too (cf. Activity). This doesn't solve
    //   anything!
    // Thus the best would be to wrap this call in a service! However, this will make the recording
    // start asynchrone and thus delayed.
    public void startDeviceDataRecording(Muse museDevice, FunctionIn1<MuseDataPacket> recordingFn) {
        assert _circularBuffer == null;
        assert _cbDataConsumer == null;
        assert _cbDataProducer == null;

        // Initiate the circular buffer here instead of in this class' constructor in order to
        // mimize the circular buffer impact on app memory.
        _circularBuffer = new ConcurrentCircularBuffer<>(MuseDataPacket.class, CIRCULAR_BUFFER_SIZE);

        // Launch consumer thread. It will store data to muse data provider.
        _cbDataConsumer = new CBDataConsumer(_circularBuffer, recordingFn);
        _cbDataConsumer.start();

        // @warning
        // We do not wait for consumer thread to start before launching producer. Considering the
        // current circular buffer settings (30 sec buffer), consumer thread will have time to
        // catch up. We could wait for consumer thread to start first for safety but that would
        // imply making this method asynchronous to allow user to know when recording is
        // effectively starting and thus reducing the end user experience as well.

        // Launch producer. It will cache data in circular buffer until they're consumed by
        // consumer thread.
        _cbDataProducer = new CBDataProducer(_circularBuffer, museDevice);
        _cbDataProducer.start();
    }

    public void stopDeviceDataRecording(Function onDataProcessingFinishedCallback) {
        assert _circularBuffer != null;
        assert _cbDataConsumer != null;
        assert _cbDataProducer != null;

        // Stop the producer thread.
        _cbDataProducer.stop();

        // Stop the consumer thread. This method calls Thread#Interrupt. Note that Thread#interrupt actually does not interrupt the
        // thread but rather set an interrupted flag to on that some methods might use to throw
        // an InterruptionException if they wish to. In our implemetation, consumer thread will
        // continue running until circular buffer is empty. That should happen soon enough (max
        // 30sec with the current CIRCULAR_BUFFER_SIZE settings).
        _cbDataConsumer.stopSafely(onDataProcessingFinishedCallback);

        _cbDataConsumer = null;

        // Clean up circular buffer to free up some memory.
        _circularBuffer = null;

        // ... recording as stopped, but consumer thread is probably still running for a short
        // while. It will stop soon enough, and GC will only then be able to free _circularBuffer
        // memory.
    }

    // Record data from nuse into circular buffer.
    // These callbacks run in the main thread (at least at the moment of writing this comment) due
    // to the current implementation of MuseDeviceExecutionThread (see specific
    // MuseDeviceExecutionThread comments).
    private class CBDataProducer extends MuseDataListener {
        private final ConcurrentCircularBuffer<MuseDataPacket> _circularBuffer;
        private final Muse _device;

        public CBDataProducer(ConcurrentCircularBuffer<MuseDataPacket> circularBuffer, Muse device) {
            super();

            _circularBuffer = circularBuffer;
            _device = device;
        }

        public void start() {
            _device.registerDataListener(this, MuseDataPacketType.EEG);
        }
        public void stop() {
            _device.unregisterDataListener(this, MuseDataPacketType.EEG);
        }

        @Override
        public void receiveMuseDataPacket(MuseDataPacket museDataPacket, Muse muse) {
            _circularBuffer.add(museDataPacket);
        }

        @Override
        public void receiveMuseArtifactPacket(MuseArtifactPacket museArtifactPacket, Muse muse) {
            // we don't care about these...
        }
    }
    private CBDataProducer _cbDataProducer = null;

    private class CBDataConsumerService extends Service {

        @Nullable
        @Override
        public IBinder onBind(Intent intent) {
            return null;
        }
    }

    // Record data from circular buffer into android provider.
    private class CBDataConsumer extends Thread {
        // @warning
        // We do not use WeakReference on purpose. Indeed, this thread will likely hold
        // the circular buffer reference outside of MuseDataCircularBuffer instance's lifecycle. This
        // should only happen for a short while, until the thread as completely finished to consume
        // the circular buffer.
        private final ConcurrentCircularBuffer<MuseDataPacket> _circularBuffer;
        private final FunctionIn1<MuseDataPacket> _recordingFn;
        private volatile Function _onDataProcessingFinishedCallback;

        public CBDataConsumer(ConcurrentCircularBuffer<MuseDataPacket> circularBuffer,
                              FunctionIn1<MuseDataPacket> recordingFn)
        {
            super();

            _circularBuffer = circularBuffer;
            _recordingFn = recordingFn;
        }

        // Helper to set data processing callback from outside this thread, likely before stopping
        // the thread through interruption.
        public void stopSafely(Function onDataProcessingFinishedCallback) {
            synchronized (this) {
                _onDataProcessingFinishedCallback = onDataProcessingFinishedCallback;
                this.interrupt(); // likely useless to put in synchronized block.
            }
        }

        @Override
        public void run() {
            // Run until thread is interrupted. No need to catch InterruptedException as we do not
            // use any method throwing it.
            while (!isInterrupted()) {
                // Retrieve
                MuseDataPacket[] dataSnapshot = _circularBuffer.snapshot();

                // Process it.
                _processSnapshot(dataSnapshot);

                // ...stop may have been triggered here and thus thread's interruption flag set.
                // However, circular buffer likely have already received new data in the
                // meanwhile...
            }

            // ...thus we process the latest data a last time after interruption has been
            // triggered.
            MuseDataPacket[] dataSnapshot = _circularBuffer.completeSnapshot();
            _processSnapshot(dataSnapshot);

            // Let function user know the processing has finished and the thread is closing.
            synchronized (this) {
                if (_onDataProcessingFinishedCallback != null) {
                    _onDataProcessingFinishedCallback.apply();
                }
            }
        }

        private void _processSnapshot(MuseDataPacket[] dataSnapshot) {
            for (MuseDataPacket dataPacket : dataSnapshot) {
                _recordingFn.apply(dataPacket);
            }
        }
    }
    private CBDataConsumer _cbDataConsumer = null;

}
