/*
 * @flow
 */

import { Platform, NativeModules, DeviceEventEmitter, PermissionsAndroid } from 'react-native';
import { Subject, merge } from 'rxjs';
import { scan, filter, map, takeUntil } from 'rxjs/operators';

export const MuseStatus = {
    BLUETOOT_AWAITING: 'BLUETOOT_AWAITING',
    BLUETOOTH_ENABLED: 'BLUETOOTH_ENABLED',
    BLUETOOTH_DISABLED: 'BLUETOOTH_DISABLED',
    MUSE_CONNECTING: 'MUSE_CONNECTING',
    MUSE_CONNECTED: 'MUSE_CONNECTED',
    MUSE_DISCONNECTED: 'MUSE_DISCONNECTED',
};

class MuseManager {

    _museManager = NativeModules.MuseManager;
    // _lastBluetoothStatus = MuseStatus.BLUETOOT_AWAITING;
    _lastMuseStatus = MuseStatus.BLUETOOT_AWAITING;

    // getBluetoothStatus() {
    //     return this._lastBluetoothStatus;
    // }

    getMuseStatus() {
        return this._lastMuseStatus;
    }

    constructor() {
        // @warning This code doesn't work if muse is already connected to the 
        //     app. User must therefore shut down & turn back on the muse 
        //     manually. However, codes automatically shut down the muse once
        //     the task has been achieved or the postponed.

        // @todo Test what happen when the app is put in background mode during
        //     the experiment (behavior is untested at the moment) !

        // @warning @todo There is the following loophole in this code: 
        //     if 2 devices are seen, 1st one will connect,
        //     then we disconnect it, 2nd one will still be available but
        //     connection wont retrigger!

        // Mock museManager if related native module is not available. This
        // happens when muse is incompatible with the current device (for
        // instance when testing the app in an emulator).
        if (!this._museManager) {
            // @note Proxy are currently unsupported in react-native. They've
            //     changed their js engine in next version so this code may 
            //     work after r-n upgrade.
            // this._museManager = new Proxy({}, {
            //     // Return a noop function for every property call in
            //     // _museManager. 
            //     get: (obj, prop) => {
            //         return () => { /* noop */ };
            //     }
            // });

            // Instead we have to mock it manually :(
            this._museManager = {
                startListeningMuseList: () => { /* noop */ },
                stopListeningMuseList: () => { /* noop */ },
                stopListeningConnectionStatus: () => { /* noop */ },
                startListeningConnectionStatus: () => { /* noop */ },
                connectMuse: () => { /* noop */ },
                checkBluetooth: () => { /* noop */ },
                disconnectMuse: () => { /* noop */ },
            };
        }

        this.onBluetoothEnabledStream = new Subject<any>();
        this.onBluetoothDisabledStream = new Subject<any>();
        this.onMuseListChangedStream = new Subject<any>();
        this.onConnectionChangedStream = new Subject<any>();
        this.onMuseConnectedStream = this.onConnectionChangedStream
            .pipe(
                filter(v => v.connectionStatus === 'CONNECTED')
            );
        this.onMuseConnectingStream = this.onConnectionChangedStream
            .pipe(
                filter(v => v.connectionStatus === 'CONNECTING')
            );
        this.onMuseDisconnectedStream = this.onConnectionChangedStream
            .pipe(
                filter(v => v.connectionStatus === 'DISCONNECTED')
            );

        this.onMuseListChangedStream.subscribe(v => { console.log('ON_MUSE_LIST_CHANGED', v); });
        this.onConnectionChangedStream.subscribe(v => console.log('ON_CONNECTION_CHANGED', v));

        this.onBluetoothDisabledStream.subscribe(v => console.log('ON_BLUETOOTH_ENABLED', v));
        // @todo @warning This use case must be handled ! as it will
        // automatically happens every time oncer the user as
        // declined the first request.
        // @todo disable "CONTINUE" button + show error.
        this.onBluetoothDisabledStream.subscribe(v => console.log('ON_BLUETOOTH_DISABLED', v));

        this._onMuseListChanged = this._onMuseListChanged.bind(this);
        this._onConnectionChanged = this._onConnectionChanged.bind(this);
        this._onBluetoothEnabled = this._onBluetoothEnabled.bind(this);
        this._onBluetoothDisabled = this._onBluetoothDisabled.bind(this);

        DeviceEventEmitter.addListener('BLUETOOTH_ENABLED', this._onBluetoothEnabled);
        DeviceEventEmitter.addListener('BLUETOOTH_DISABLED', this._onBluetoothDisabled);
        DeviceEventEmitter.addListener('MUSE_LIST_CHANGED', this._onMuseListChanged);
        DeviceEventEmitter.addListener('CONNECTION_CHANGED', this._onConnectionChanged);
    }

    unsubscribe$ = new Subject();

    startListening() {
        this.onBluetoothEnabledStream
            .pipe(
                takeUntil(this.unsubscribe$),
            )
            .subscribe(v => {
                this._lastBluetoothStatus = MuseStatus.BLUETOOTH_ENABLED;
                this._museManager.startListeningMuseList();
            });
        this.onBluetoothDisabledStream
            .pipe(
                takeUntil(this.unsubscribe$),
            )
            .subscribe(v => {
                this._lastBluetoothStatus = MuseStatus.BLUETOOTH_DISABLED;
                this._museManager.stopListeningMuseList();
            });

        this.onMuseConnectedStream
            .pipe(
                takeUntil(this.unsubscribe$),
            )
            .subscribe(v => {
                this._lastMuseStatus = MuseStatus.MUSE_CONNECTED;
                this._museManager.stopListeningMuseList();
            });
        this.onMuseConnectingStream
            .pipe(
                takeUntil(this.unsubscribe$),
            )
            .subscribe(v => {
                this._lastMuseStatus = MuseStatus.MUSE_CONNECTING;
            });
        this.onMuseDisconnectedStream
            .pipe(
                takeUntil(this.unsubscribe$),
            )
            .subscribe(v => {
                this._lastMuseStatus = MuseStatus.MUSE_DISCONNECTED;
                this._museManager.stopListeningConnectionStatus(); // Will be started back as soon as muselist has elements again
                this._museManager.startListeningMuseList();
            });

        // Auto connect to the first muse appearing in list.
        let _mergedSetResetOnMuseListChangedStream = 
            merge(
                // Muse list Set stream
                this.onMuseListChangedStream
                    .pipe(
                        filter(v => v.length > 0),
                        map(v => ({type: 'SET', payload: v}))
                    ),
                // Muse list Reset stream
                this.onMuseListChangedStream
                    .pipe(
                        filter(v => v.length === 0),
                        map(v => ({type: 'RESET'}))
                    )
            );
        
        _mergedSetResetOnMuseListChangedStream.pipe(
                // Only take set streams after a reset (clear out multiple adjacent
                // set if multiple muse are present in the same room).
                scan(([prev2, prev] = [], curr, index: number) => {
                    return [prev || undefined, curr];
                }, undefined),
                filter(([prev, curr]) => curr.type === 'SET' && (!prev || prev.type === 'RESET')),
                map(([prev, curr]) => curr),
            )
            .subscribe(v => {
                // v.payload = muse list !
                this._museManager.stopListeningMuseList();
                this._museManager.startListeningConnectionStatus();
                this._museManager.connectMuse(0);
            });

        _mergedSetResetOnMuseListChangedStream.pipe(
                // Only take set streams after a reset (clear out multiple adjacent
                // set if multiple muse are present in the same room).
                scan(([prev2, prev] = [], curr, index: number) => {
                    return [prev || undefined, curr];
                }, undefined),
                filter(([prev, curr]) => curr.type === 'RESET' && prev && prev.type === 'SET'),
                map(([prev, curr]) => curr),
            )
            .subscribe(v => {
                console.log('!! MUSE LIST RESET');
                // v.payload = muse list !
                // this._museManager.stopListeningConnectionStatus();
            });

        // @todo activate bluetooth manually!
        
        // // We need to add runtime permission check for dangerous permissions
        // // on android ^23.
        // (async () => {
        //     // Disable runtime permission check on IOS
        //     if (Platform.OS !== 'android') {
        //         return;
        //     }

        //     try {
        //         const granted = await PermissionsAndroid.request(
        //             PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        //             {
        //                 title: 'Permission Localisation/Bluetooth',
        //                 message:
        //                     'Veuillez activer la permission suivante ' +
        //                     'pour pouvoir connecter votre Muse.',
        //                 // buttonNeutral: 'Plus tard!',
        //                 buttonNegative: 'Plus tard!',
        //                 buttonPositive: 'OK',
        //             },
        //         );
        //         if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        //             console.log('ACCESS_COARSE_LOCATION/BLUETOOTH permission granted!');
        //             this.onBluetoothEnabledStream.next();
        //         } else {
        //             console.log('ACCESS_COARSE_LOCATION/BLUETOOTH permission denied!');
        //             this.onBluetoothDisabledStream.next();
        //         }
        //     } catch (err) {
        //         console.warn(err);
        //     }
        // })();

        // Retrieve bluetooth status.
        this._museManager.checkBluetooth();
    }

    stopListening() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
        this._museManager.stopListeningConnectionStatus();
        this._museManager.stopListeningMuseList();
    }

    disconnectMuse() {
        this._museManager.disconnectMuse();
        this._museManager.stopListeningConnectionStatus();
        this._lastMuseStatus = MuseStatus.MUSE_DISCONNECTED;
    }

    _onBluetoothEnabled(evt: Event) {
        this.onBluetoothEnabledStream.next(evt);
    }
    _onBluetoothDisabled(evt: Event) {
        this.onBluetoothDisabledStream.next(evt);
    }
    _onConnectionChanged(evt: Event) {
        this.onConnectionChangedStream.next(evt);
    }
    _onMuseListChanged(evt: Event) {
        this.onMuseListChangedStream.next(evt);
    }

    __never__() {
        DeviceEventEmitter.removeListener('CONNECTION_CHANGED', this._onConnectionChanged);
        DeviceEventEmitter.removeListener('MUSE_LIST_CHANGED', this._onMuseListChanged)
        DeviceEventEmitter.removeListener('BLUETOOTH_DISABLED', this._onBluetoothDisabled);
        DeviceEventEmitter.removeListener('BLUETOOTH_ENABLED', this._onBluetoothEnabled);
    }
}

const museManager = new MuseManager();

export default museManager;
