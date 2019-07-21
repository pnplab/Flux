package org.pnplab.flux.restingstatetask.model;

import com.choosemuse.libmuse.Muse;

import org.pnplab.flux.utils.FunctionIn1;

import java.util.List;

public interface IMuseDeviceListObserver {

    // @pre MuseDeviceListObserver can only have one listener at a time !
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
    void listenDeviceListChange(FunctionIn1<List<Muse>> onDeviceListChanged);
    void unlistenDeviceListChange();
    boolean isEmpty();

    Muse getFirstDevice();
}
