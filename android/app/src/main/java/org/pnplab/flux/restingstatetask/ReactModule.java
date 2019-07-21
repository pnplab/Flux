package org.pnplab.flux.restingstatetask;

import android.util.Log;

import com.choosemuse.libmuse.MuseManagerAndroid;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import org.pnplab.flux.restingstatetask.model.muse_data_recorder.MuseDataRepository;
import org.pnplab.flux.utils.IProcessPriorityPromoter;
import org.pnplab.flux.utils.IPermissionManager;
import org.pnplab.flux.restingstatetask.components.PrepareTaskScreen;
import org.pnplab.flux.restingstatetask.components.VideoScreen;
import org.pnplab.flux.restingstatetask.model.BluetoothManager;
import org.pnplab.flux.utils.FunctionIn1;
import org.pnplab.flux.restingstatetask.model.MuseAutoConnection;
import org.pnplab.flux.restingstatetask.model.MuseDeviceListObserver;
import org.pnplab.flux.restingstatetask.model.MuseDeviceManager;

import javax.annotation.Nonnull;

@SuppressWarnings("FieldCanBeLocal")
public class ReactModule extends ReactContextBaseJavaModule {

    private final BluetoothManager _bluetoothManager;
    private final MuseDeviceListObserver _museDeviceListObserver;
    private final MuseDataRepository _museDataRepository;
    private final MuseDeviceManager _museDeviceManager;
    private final MuseAutoConnection _museAutoConnection;
    private final PrepareTaskScreen _prepareTaskScreen;
    private final VideoScreen _videoScreen;

    public enum Event {
        TASK_PREPARATION_STATE_CHANGED
    }

    ReactModule(@Nonnull ReactApplicationContext reactContext, IPermissionManager permissionManager,
                IProcessPriorityPromoter backgroundStatePromoter) {
        super(reactContext);

        // MuseManagerAndroid must be created and given context before any LibMuse calls can be
        // made.
        MuseManagerAndroid manager = MuseManagerAndroid.getInstance();
        manager.setContext(reactContext);

        // Configure used helpers.
        _bluetoothManager = new BluetoothManager();
        _museDeviceListObserver = new MuseDeviceListObserver();
        _museDataRepository = new MuseDataRepository(reactContext.getContentResolver());
        _museDeviceManager = new MuseDeviceManager();
        _museAutoConnection = new MuseAutoConnection(_museDeviceListObserver, _museDeviceManager);

        // The resting state task flows through multiple screens. Configure screen-related classes.
        _prepareTaskScreen = new PrepareTaskScreen(reactContext, permissionManager, _onPreparationStateChanged, _bluetoothManager, _museDeviceManager, _museAutoConnection);
        _videoScreen = new VideoScreen(reactContext, _museDataRepository, _museDeviceManager, backgroundStatePromoter);
    }

    @Nonnull
    @Override
    public String getName() {
        return "RestingStateTask";
    }


    // Screen : Prepare Resting State Task.
    @ReactMethod
    public void onPreparationViewOpened() {
        _prepareTaskScreen.onPreparationViewOpened();
    }

    @ReactMethod
    public void onStartTaskButtonClicked() {
        _prepareTaskScreen.onStartTaskButtonClicked();
    }

    @ReactMethod
    public void onStartTaskButtonLongPush() {
        _prepareTaskScreen.onStartTaskButtonLongPush();
    }

    // Send current task prepartion state change to javascript through event.
    private FunctionIn1<PrepareTaskScreen.State> _onPreparationStateChanged = state -> {
        Log.v("Flux","restingstatetask.ReactModule#_sendStateChangedEvent " + Event.TASK_PREPARATION_STATE_CHANGED.name());

        WritableMap parameters = Arguments.createMap();
        parameters.putString("state", state.name());

        getReactApplicationContext()
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(Event.TASK_PREPARATION_STATE_CHANGED.name(), parameters);
    };

    // Send

    // Screen : Resting State Task Video.
    /*
    @ReactMethod
    public void onVideoViewOpened() {
       _videoScreen.onVideoViewOpened();
    }

    @ReactMethod
    public void onVideoViewClosed() {
        _videoScreen.onVideoViewClosed();
    }
    */

    @ReactMethod
    public void onVideoStreamStarted() {
        _videoScreen.onVideoStreamStarted();
    }

    @ReactMethod
    public void onVideoStreamFinished() {
        _videoScreen.onVideoStreamFinished();
    }

    @ReactMethod
    public void onVideoLoadingError() {
        _videoScreen.onVideoLoadingError();
    }


    // ... _videoScreen instance directly forwards events to JS.
}
