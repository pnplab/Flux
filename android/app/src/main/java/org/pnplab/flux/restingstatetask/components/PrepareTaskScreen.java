package org.pnplab.flux.restingstatetask.components;

import com.choosemuse.libmuse.ConnectionState;
import com.facebook.react.bridge.ReactApplicationContext;

import org.pnplab.flux.utils.IPermissionManager;
import org.pnplab.flux.restingstatetask.model.BluetoothManager;
import org.pnplab.flux.utils.Function;
import org.pnplab.flux.utils.FunctionIn1;
import org.pnplab.flux.restingstatetask.model.MuseAutoConnection;
import org.pnplab.flux.restingstatetask.model.MuseDeviceManager;

import static android.Manifest.permission.ACCESS_COARSE_LOCATION;
import static android.Manifest.permission.ACCESS_FINE_LOCATION;
import static org.pnplab.flux.utils.IPermissionManager.PermissionResult.PERMISSION_GRANTED;

public class PrepareTaskScreen {

    public enum State {
        UNDEFINED,
        BLUETOOTH_DISABLED,
        MUSE_DISCONNECTED,
        MUSE_CONNECTING,
        MUSE_CONNECTED
    }

    private final IPermissionManager _permissionManager;
    private final ReactApplicationContext _context;
    private final FunctionIn1<State> _onPreparationStateChanged;
    private final BluetoothManager _bluetoothManager;
    private final MuseDeviceManager _museDeviceManager;
    private final MuseAutoConnection _museAutoConnection;

    private State _currentState = State.UNDEFINED;

    public PrepareTaskScreen(ReactApplicationContext context,
                             IPermissionManager permissionManager,
                             FunctionIn1<State> onPreparationStateChanged,
                             BluetoothManager bluetoothManager,
                             MuseDeviceManager museDeviceManager,
                             MuseAutoConnection museAutoConnection
    ) {
        _context = context;

        _permissionManager = permissionManager;
        _bluetoothManager = bluetoothManager;
        _museDeviceManager = museDeviceManager;
        _museAutoConnection = museAutoConnection;
        _onPreparationStateChanged = onPreparationStateChanged;
    }

    // Enable bluetooth and connect to muse device asap when the view is opened.
    // @pre Requires ACCESS_COARSE_LOCATION or ACCESS_FINE_LOCATION permissions !
    // @todo listen to muse deconnection and reconnection (for now it only listen to the first connection)
    public void onPreparationViewOpened() {
        // Store the function implementation in a lambda first so we can run it either synchronously or
        // asynchronously if permission request is needed first.
        Runnable _onPreparationViewOpenedImpl = () -> {
            // Start auto connection if bluetooth is enabled.
            boolean isBluetoothEnabled = _bluetoothManager.isBluetoothEnabled();
            if (isBluetoothEnabled) {
                _museAutoConnection.start(_onMuseConnectionStatusChanged);
            }

            // Propagate future bluetooth status change to js and start/stop auto connection mechanism
            // upon these.
            _bluetoothManager.listenBluetoothStateChange(_context, _onBluetoothConnectionChanged);

            // Enable bluetooth as soon as the user open the task.
            _bluetoothManager.enableBluetooth();

            // Propagate current bluetooth status to js.
            _updateStateIfNeeded();
        };

        // Permission ACCESS_COARSE_LOCATION or ACCESS_FINE_LOCATION must be granted so muse API
        // can scan for devices through bluetooth... Careful, muse API catch exceptions for log but
        // doesn't rethrow! FINE is probably granted everytime COARSE is, but well.. No time to
        // check. Also, Android provides no way to request the permission synchronously, and while
        // it's possible to request it asynchronously, it requires to override the
        // onRequestPermissionsResult method of the current activity and thus can be done only
        // outside of react native module scope... The solution consist of making these activity
        // methods provide a delegation mechanism (which react native do but keeps private inside
        // the class..) in order to make them accessible from outside the activity class code...
        if (_permissionManager.isPermissionGranted(ACCESS_FINE_LOCATION) && _permissionManager.isPermissionGranted(ACCESS_COARSE_LOCATION)) {
            // Proceed synchronously.
            _onPreparationViewOpenedImpl.run();
        }
        else {
            _permissionManager.requestPermission(ACCESS_FINE_LOCATION, permissionResult -> {
                if (permissionResult == PERMISSION_GRANTED) {
                    // Proceed asynchronously.
                    _onPreparationViewOpenedImpl.run();
                }
                else {
                    // Throw an exception if permission was denied.
                    // @warning This is likely to make the app crashes.
                    throw new SecurityException("ACCESS_FINE_LOCATION or ACCESS_COARSE_LOCATION permission missing for bluetooth handling with muse.");

                    // @todo Forward exception to js through event and allow error handling through
                    //       UI. Not high level requirement because onboarding already manages this
                    //       so it only happen if the user go to settings to disable the permission
                    //       manually.
                }
            });
        }
    }

    // The js starts the video once the user pushes the start task button. The button is only
    // enabled if the muse device is connected. This method disposes unrelevant listeners.
    public void onStartTaskButtonClicked() {
        // Dispose irrelevant listeners.
        _bluetoothManager.unlistenBluetoothStateChange(_context);

        // Reset current state even though.
        _currentState = State.UNDEFINED;

        // ... Device connection should be kept to next screen (although it's out of our full
        // control, as with any connection).
    }

    // The js bypass the task on long push on the start task button. This is mostly used for
    // E2E as it's not possible to use the Muse on OSX emulator or on AWS device farms.
    // Dispose unrelevant listeners and stop connection mechanism.
    public void onStartTaskButtonLongPush() {
        // Dispose irrelevant listeners.
        _bluetoothManager.unlistenBluetoothStateChange(_context);

        // Stop muse connection.
        if (_museAutoConnection.isConnectionAttemptOngoingOrHaveSucceed()) {
            _museAutoConnection.cancelOrDisconnect();
        }

        // Reset current state.
        _currentState = State.UNDEFINED;
    }

    // Propagate connection status change to js.
    @SuppressWarnings("CodeBlock2Expr")
    private FunctionIn1<ConnectionState> _onMuseConnectionStatusChanged = (connectionStatus) -> {
        _updateStateIfNeeded();
    };

    // Start/stop muse auto connection based on bluetooth status and propagate change to js.
    private Function _onBluetoothConnectionChanged = () -> {
        // The following variable are initialised in controller. These lines prevent compilation
        // from failing due to (yet) uninitialised final variable usage as the lambda scope != this
        // but rather the instance declaration scope, wich are nearly equivalant concepts.
        BluetoothManager bluetoothManager = PrepareTaskScreen.this._bluetoothManager;
        MuseAutoConnection museAutoConnection = PrepareTaskScreen.this._museAutoConnection;
        
        // Propagate bluetooth status change to js.
        _updateStateIfNeeded();

        // Start auto connection if bluetooth is enabled.
        boolean isBluetoothEnabled = bluetoothManager.isBluetoothEnabled();
        if (isBluetoothEnabled) {
            museAutoConnection.start(_onMuseConnectionStatusChanged);
        }
        // Stop muse auto connection if bluetooth is no longer present.
        else {
            if (museAutoConnection.isConnectionAttemptOngoingOrHaveSucceed()) {
                museAutoConnection.cancelOrDisconnect();
            }
        }
    };

    // Propagate bluetooth and connection status change to JS.
    private void _updateStateIfNeeded() {
        boolean isBluetoothEnabled = _bluetoothManager.isBluetoothEnabled();
        ConnectionState museConnectionState = _museDeviceManager.getConnectionState();

        State oldState = _currentState;

        if (museConnectionState == ConnectionState.CONNECTED) {
            _currentState = State.MUSE_CONNECTED;
        }
        else if (museConnectionState == ConnectionState.CONNECTING) {
            _currentState = State.MUSE_CONNECTING;
        }
        else if (museConnectionState == ConnectionState.DISCONNECTED && isBluetoothEnabled) {
            _currentState = State.MUSE_DISCONNECTED;
        }
        else if (!isBluetoothEnabled) {
            _currentState = State.BLUETOOTH_DISABLED;
        }

        boolean hasStateChanged = _currentState != oldState;

        // Propagate change to JS through event.
        if (hasStateChanged) {
            _onPreparationStateChanged.apply(_currentState);
        }
    }
}
