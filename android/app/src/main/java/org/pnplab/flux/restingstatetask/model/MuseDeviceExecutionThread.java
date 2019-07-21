package org.pnplab.flux.restingstatetask.model;

import com.choosemuse.libmuse.Muse;

import java.lang.ref.WeakReference;

public class MuseDeviceExecutionThread extends Thread {

    private final WeakReference<Muse> _device;

    public MuseDeviceExecutionThread(WeakReference<Muse> device) {
        super();

        _device = device;
    }

    // @note A few notes from doc.
    // - All Muse class methods are thread safe, except for #runAsynchronously and #execute.
    // - All Muse callbacks are executed on the main thread when #runAsynchronously is used, even
    //   if it's used in another thread! To have callback be executed in another thread, on must
    //   rely on Muse#execute instead of Muse#runAsynchronously.
    @Override
    public void run() {
        // Initiate a connection to the headband and stream the data asynchronously.
        // runAsynchronously() handles most of the work to connect to the Muse by itself.
        _device.get().runAsynchronously();
    }

}
