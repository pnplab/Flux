package org.pnplab.phenotype.synchronization;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.ConnectivityManager;
import android.net.ConnectivityManager.NetworkCallback;
import android.net.LinkProperties;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkInfo;
import android.net.NetworkRequest;
import android.net.wifi.WifiManager;
import android.os.Build;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;

import org.jetbrains.annotations.NotNull;
import org.pnplab.phenotype.logger.AbstractLogger;

import java.util.concurrent.TimeUnit;

import io.reactivex.rxjava3.core.Observable;

public class WifiStatus {

    // # General notes about wifi state change acquisition.
    // ApplicationContext over service context recommended to avoid memory
    // leak bug on android 4.2.
    // cf. https://issuetracker.google.com/issues/36964970
    //
    // See android market shares by API for canada (eq ~ 2% for android Kitkat
    // (API 19 & 20) in febr. 2020.
    // cf. https://gs.statcounter.com/android-version-market-share/mobile-tablet/canada
    //
    // WIFI_STATE_CHANGED_ACTION != NETWORK_STATE_CHANGED_ACTION
    // WIFI_STATE_CHANGED_ACTION == android.net.wifi.WIFI_STATE_CHANGED
    // NETWORK_STATE_CHANGED     == android.net.wifi.STATE_CHANGE
    // First one
    // cf. https://stackoverflow.com/questions/17929086/android-net-wifi-wifi-state-changed-not-being-broadcast
    //
    // CONNECTIVITY_ACTION == android.net.conn.CONNECTIVITY_CHANGE
    // cf. https://developer.android.com/reference/android/net/wifi/WifiManager#WIFI_STATE_CHANGED_ACTION
    //
    // For this user, broadcast WIFI_STATE_CHANGED_ACTION is not being
    // delivered while WifiManager.NETWORK_STATE_CHANGED_ACTION is.
    // cf. https://stackoverflow.com/a/6741489/939741
    //
    // android.net.wifi.STATE_CHANGE seems to work well and trigger once
    // wifi connection has been established (instead of just wifi lookup).
    // cf. https://stackoverflow.com/questions/5888502/how-to-detect-when-wifi-connection-has-been-established-in-android#comment90361390_22626736
    //
    // Confirmed and explained here.
    // cf. https://stackoverflow.com/questions/17929086/android-net-wifi-wifi-state-changed-not-being-broadcast
    //
    // Some user states they have manifest permission mis-configuration issues.
    // cf. https://stackoverflow.com/a/41277877/93974
    // These contradicts official doc states "No network-related permissions
    // are required to subscribe to this broadcast" is req. for this.
    // cf. https://developer.android.com/reference/android/net/wifi/WifiManager#WIFI_STATE_CHANGED_ACTION
    //
    // Broadcast NETWORK_STATE_CHANGED_ACTION is not delivered to manifest
    // receivers in applications that target API version 26 or later.
    // ---> manifest receivers probably refers to implicit broadcast receiver.
    // cf. https://developer.android.com/reference/android/net/wifi/WifiManager#NETWORK_STATE_CHANGED_ACTION
    // cf. https://stackoverflow.com/questions/9425187/broadcastreceiver-declared-in-manifest-is-not-receiving-the-broadcast
    //
    // AWARE uses WIFI_STATE_CHANGED_ACTION and it seems to work fine,
    // although might actually depends on android version (and would
    // explain why data doesn't upload on some phone). -- Also, shouldn't
    // trigger on WIFI *connectivity* change.
    //
    // Recommended android method of NetworkCallbacks is API21+.
    // cf. https://developer.android.com/training/monitoring-device-state/connectivity-status-type
    // Docs then recommend NetworkCapabilities from NetworkCallback.
    // Difference between NetworkCallback and NetworkCapabilities seems to be
    // one is receive events for all networks while the other is
    // network-specific (ie. in case there is multiple 4G or wifi ship
    // installed). Although I am not sure.
    // cf. https://developer.android.com/reference/android/net/ConnectivityManager.NetworkCallback
    // EDIT: actually, response from android engineer, multiple wifi are an
    // use-case. cf. https://gist.github.com/PasanBhanu/730a32a9eeb180ec2950c172d54bb06a#gistcomment-3095217
    //
    // getActiveNetworkInfo() was deprecated in Android 10. Use
    // NetworkCallbacks instead for apps that target Android 10 (API level 29)
    // and higher.
    // cf. https://developer.android.com/training/monitoring-device-state/connectivity-status-type
    //
    // Broadcast listening android.net.conn.CONNECTIVITY_CHANGE is deprecated.
    // cf. https://stackoverflow.com/questions/31689513/broadcastreceiver-to-detect-network-is-connected?noredirect=1&lq=1#comment53812628_31689805
    //
    // @warning
    // For android API lt21 broadcast receiver method.
    // ConnectivityManager.CONNECTIVITY_CHANGE triggers two intents on
    // connection, with both getType() == TYPE_WIFI and isConnected() == true.
    // WifiManager.NETWORK_STATE_CHANGED_ACTION doesn't trigger on wifi
    // disconnection.
    // WifiManager.NETWORK_STATE_CHANGED_ACTION triggers two different intents
    // on connection, one with isConnected() == true and the other with
    // getType() == TYPE_WIFI, only isConnected() should be checked for thus.
    // Thus, a mix of the two should be used.
    // cf. https://stackoverflow.com/a/5890104/939741
    //
    // @warning
    // CONNECTIVITY_CHANGE potentially triggers false negative (disconnected)
    // in case of low battery (<15/20%) with app switched to background with
    // switch from WIFI to 3G, but we shouldn't have the issue, as we only
    // consider WIFI connection and are not interested on checking connection
    // consistency between WIFI <-> 3G.
    // cf. https://stackoverflow.com/questions/34884442/android-checking-network-connectivity-return-not-connected-when-connected-to-wi/45231746#45231746
    //
    // # About ReactiveNetwork
    // For cross platform network status listener, incl. android < API 21, we
    // use ReactiveNetwork library. It can monitor both network and internet
    // connectivity (user can be connected to wifi without having access to
    // internet). We only monitor for network in our code though.
    // cf. https://github.com/pwittchen/ReactiveNetwork
    //
    // Link to use deprecated broadcast receiver w/ rxjava.
    // https://stackoverflow.com/questions/38242462/internet-check-where-to-place-when-using-mvp-rx-and-retrofit/38281335#38281335
    //
    // It uses non-deprecated ConnectivityManager Network Callback for 21+ and
    // broadcast for < API 21 (CONNECTIVITY_ACTION).
    // cf. http://pwittchen.github.io/ReactiveNetwork/docs/RxJava2.x/#/?id=observing-network-connectivity
    // cf. https://developer.android.com/reference/android/net/ConnectivityManager.NetworkCallback
    // @warning broadcast should fail according to android doc due to target
    //     API > 26, although it seems to work with aware which target API 28.
    //     This restriction thus probably only applies to implicit broadcast
    //     receiver.
    //
    // Uses NET_CAPABILITY_INTERNET and NET_CAPABILITY_NOT_RESTRICTED
    // (instead of more-specific, recommended WIFI capability request)
    // with NetworkCapability, but used through ConnectivityManager which
    // expect to send info for a single network channel.
    // @warning ConnectivityManager is expected to fallback to other
    //     connection in case of connection issue but nothing is stated
    //     about switching to better connection if available (eg. from 4g
    //     to wifi). We don't know whether both WIFI connection and
    //     disconnection are discovered across android versions.
    //     Found that bug from 7 Aug. 2019:
    //     `fixed bug #330 - State CONNECTED sometimes is not returned when
    //     wifi is turned off while having mobile internet connection
    //     (Android 9)`.
    //     cf. https://github.com/pwittchen/ReactiveNetwork/blob/dc7c379090bf8c01a24edd7a683e7afdabc1280d/CHANGELOG.md#v-304
    //     cf. https://github.com/pwittchen/ReactiveNetwork/issues/330
    // @warning will probably trigger dual events on wifi connection due to
    //     usage of CONNECTIVITY_ACTION according to
    //     https://stackoverflow.com/a/5890104/939741.
    // cf. https://developer.android.com/reference/android/net/ConnectivityManager#registerNetworkCallback(android.net.NetworkRequest,%20android.app.PendingIntent)
    // cf. https://github.com/pwittchen/ReactiveNetwork/blob/RxJava2.x/library/src/main/java/com/github/pwittchen/reactivenetwork/library/rx2/network/observing/strategy/MarshmallowNetworkObservingStrategy.java
    //
    // There is a specialised - less-maintained - version of this library
    // for wifi.
    // cf. https://github.com/pwittchen/ReactiveWiFi
    //
    // A generalist blog post https://medium.com/ki-labs-engineering/monitoring-wifi-connectivity-status-part-1-c5f4287dd57.

    // manual connection (not network) check code.
    // cf. https://stackoverflow.com/a/16124915/939741

    // Therefore, for network connectivity we use,
    // * [API 21+]
    //   NetworkCapability through ConnectivityManager with specific wifi
    //   intent, considering...
    // - it triggers on wifi connection (not wifi activation)
    // - it doesn't trigger multiple events in case multiple wifi ship are
    //   available (although this req. of NetworkCapability API has likely
    //   been designed for dual SIM card network considerations instead).
    // - we're sure 3g<->wifi switching will trigger the appropriate
    //   disconnection events.
    //
    // * [API lt21]
    //   NETWORK_STATE_CHANGED_ACTION + CONNECTIVITY_CHANGE event broadcast,
    //   considering...
    // - NetworkCapability is not available on API lt21
    // - CONNECTIVITY_CHANGE trigger connection twice, while
    //   NETWORK_STATE_CHANGED_ACTION doesn't trigger disconnection.
    // - ineffectiveness on target API 26+ only seems to apply to implicit
    //   manifest/broadcasts and not dynamically created one (although we use
    //   it on API lt21, we still target API 26+).
    // - although docs states it triggers on enabled/disabled wifi, user
    //   reports it triggers on connected/disconnected wifi instead on
    //   stackoverflow.
    // - dual events shouldn't occur as it's already highly unlikely to see dual
    //   wifi on recent android devices, it's close to impossible on old
    //   android version.
    //
    // While for internet connectivity we use,
    // * [API 23+]
    //   Flag NET_CAPABILITY_VALIDATED on top of NetworkCapability.
    // - there is no reason not to use it as no false negative have been
    //   reported (only false positive), thus it won't impact our api usage.
    // - it seems to be the only official available method to provide internet
    //   network status on wifi.
    //
    // * Everywhere
    //   Stream error/exception reporting transmission failure piped to
    //   other (non-internet, ie. sqlite local storage) stream as a fallback.
    //   @warning this might overwhelm phone for high freq. sensors (to be tested).
    // - NET_CAPABILITY_VALIDATED fails on "Xiaomi Redmi 3S MIUI 8", we need a
    //   fallback even on API 23+ cf. https://stackoverflow.com/a/41063539/93974
    // - monitoring of network connectivity change can't prevent connectivity
    //   failure/broken pipe during transfer. Alternative methods such as
    //   internet monitoring through ping connectivity don't provide that
    //   either. Thus, we need a reliable fallback even on API 23+.
    // - recommended stackoverflow ping method could be broken due to firewalls
    //   blocking ICMP packets in some cases. cf. https://serverfault.com/a/312936

    // 1. impl.

    @RequiresApi(api = Build.VERSION_CODES.LOLLIPOP)
    private static @NonNull Observable<Boolean> streamWifiStatusFromNetworkCapabilities(final Context context_, AbstractLogger log) {
        log.t();

        // Listen to network wifi connectivity status on API 21+ and
        // minimise false positive about internet connectivity as well as
        // much as possible depending on what current android API version
        // allows.
        //
        // @warning doesn't seems to trigger a first response event
        //     automatically at subscription when wifi is not available. It
        //     does when wifi is available though. It is thus required to
        //     compensate that edge case. This has been manually checked on
        //     android 8 phone
        // @note can trigger errors (through rxjava onError), these could be
        //     morphed into "false" value.
        @NonNull Observable<Boolean> wifiStatusStream = Observable.create(emitter -> {
            // Retrieve connectivity service to register our wifi status
            // listener to.
            //
            // @note
            // ApplicationContext over service context recommended to avoid
            // memory leak bug on at least android 4.2 and 5.x. Probably
            // unnecessary with ConnectivityManager and NetworkCapabilities
            // though.
            // cf. https://issuetracker.google.com/issues/36964970
            final Context context = context_.getApplicationContext();
            final String service = Context.CONNECTIVITY_SERVICE;
            final ConnectivityManager connectivityManager = (ConnectivityManager) context.getSystemService(service);

            // Check connectivity manager is not null. This check should not be
            // required, as getSystemService only returns null when used in
            // instant app for specific service (excluding
            // CONNECTIVITY_SERVICE), but for safety..
            if (connectivityManager == null) {
                if (!emitter.isDisposed()) {
                    emitter.onError(new IllegalAccessException("context#getSystemService failed with CONNECTIVITY_SERVICE"));
                }
                return;
            }

            // Forward error if we we do not have the required SDK version (21+).
            if (Build.VERSION.SDK_INT < 21) {
                if (!emitter.isDisposed()) {
                    emitter.onError(new IllegalAccessException("This stream requires Android SDK 21+"));
                }
                return;
            }

            // Create network status change listener with specified
            // characteristics (wifi, including internet).
            log.v("+TRANSPORT_WIFI");
            log.v("+TRANSPORT_ETHERNET");
            log.v("+NET_CAPABILITY_TRUSTED");
            log.v("+NET_CAPABILITY_NOT_RESTRICTED");
            log.v("+NET_CAPABILITY_INTERNET");
            NetworkRequest.Builder wifiCallbackRequestBuilder = new NetworkRequest
                    .Builder()
                    // @note TRANSPORT_WIFI_AWARE should not be included as
                    // this relates to direct phone-to-phone wifi communication.
                    .addTransportType(NetworkCapabilities.TRANSPORT_WIFI)
                    .addTransportType(NetworkCapabilities.TRANSPORT_ETHERNET)
                    // @note NET_CAPABILITY_TRUSTED is included by default
                    // anyway. Probably discards only unselected automatic
                    // public wifi network (doc statement).
                    .addCapability(NetworkCapabilities.NET_CAPABILITY_TRUSTED)
                    // @note suspect NET_CAPABILITY_NOT_RESTRICTED might
                    // detect network restriction due to doze restriction for
                    // instance (that might have to be detected otherwise,
                    // according to https://github.com/pwittchen/ReactiveNetwork/issues/115).
                    .addCapability(NetworkCapabilities.NET_CAPABILITY_NOT_RESTRICTED)
                    .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);

            // Add capabilities only available on API 23+.
            if (Build.VERSION.SDK_INT >= 23) {
                log.v("+NET_CAPABILITY_VALIDATED");

                // @warning only API 23+.
                // "for a network with NET_CAPABILITY_INTERNET, it means that
                // Internet connectivity was successfully detected" -
                // cf. https://developer.android.com/reference/android/net/NetworkCapabilities#NET_CAPABILITY_VALIDATED
                wifiCallbackRequestBuilder = wifiCallbackRequestBuilder
                        .addCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED);
            }

            // Add capabilities only available on API 28+.
            if (Build.VERSION.SDK_INT >= 28) {
                log.v("+NET_CAPABILITY_FOREGROUND");
                log.v("+NET_CAPABILITY_NOT_SUSPENDED");
                wifiCallbackRequestBuilder = wifiCallbackRequestBuilder
                        // @note only API 28+. "Indicates that this network is
                        // available for use by apps, and not a network that is
                        // being kept up in the background to facilitate fast
                        // network switching."
                        .addCapability(NetworkCapabilities.NET_CAPABILITY_FOREGROUND)
                        // @note only API 28+. "if a cellular network experiences a
                        // temporary loss of signal, such as when driving through a
                        // tunnel, etc. A network with this capability is not
                        // suspended, so is expected to be able to transfer data." -
                        // cf. https://developer.android.com/reference/android/net/NetworkCapabilities#NET_CAPABILITY_NOT_SUSPENDED
                        .addCapability(NetworkCapabilities.NET_CAPABILITY_NOT_SUSPENDED);
            }

            // Construct the final network status change listener request
            // object.
            final NetworkRequest wifiCallbackRequest = wifiCallbackRequestBuilder.build();

            // Build android wifi status listener and forward result to
            // rxjava's stream.
            // @note
            // NetworkCallback's onAvailable and onLost callbacks should be
            // 100% reliable while other depends on edge-cases.
            // @note
            // We do not rely on onUnavailable as it requires to add a time out
            // to connection that unregisters the callback automatically when
            // no network is available.
            NetworkCallback wifiStatusListener = new NetworkCallback() {
                @Override
                public void onAvailable(@NotNull Network network) {
                    super.onAvailable(network);
                    log.t();
                    if (!emitter.isDisposed()) {
                        emitter.onNext(true);
                    }
                }

                @Override
                public void onLost(@NotNull Network network) {
                    super.onLost(network);
                    log.t();
                    if (!emitter.isDisposed()) {
                        emitter.onNext(false);
                    }
                }

                @Override
                public void onCapabilitiesChanged(@NonNull Network network,
                                                  @NonNull NetworkCapabilities networkCapabilities) {
                    super.onCapabilitiesChanged(network, networkCapabilities);
                    log.t();
                }

                @Override
                public void onBlockedStatusChanged(@NonNull Network network, boolean blocked) {
                    super.onBlockedStatusChanged(network, blocked);
                    log.t();
                }

                @Override
                public void onLinkPropertiesChanged(@NonNull Network network, @NonNull LinkProperties linkProperties) {
                    super.onLinkPropertiesChanged(network, linkProperties);
                    log.t();
                }

                @Override
                public void onLosing(@NonNull Network network, int maxMsToLive) {
                    super.onLosing(network, maxMsToLive);
                    log.t();
                }

                @Override
                public void onUnavailable() {
                    super.onUnavailable();
                    log.t();
                }

                /*
                @Override
                public void onNetworkSuspended(@NonNull Network network) {
                    log.t();
                    // super.onUnavailable();
                }

                public void onNetworkResumed(@NonNull Network network) {
                    log.t();
                }
                */
            };

            // Register wifi status change's listener.
            connectivityManager.registerNetworkCallback(wifiCallbackRequest, wifiStatusListener);

            // Unregister wifi status change listener when stream is no longer
            // listened to.
            emitter.setCancellable(() -> {
                log.d("unregisterNetworkCallback");
                connectivityManager.unregisterNetworkCallback(wifiStatusListener);
            });
        });

        // When wifi hasn't been found within a short delay after subscription,
        // emit 'false' (== no wifi).
        @NonNull Observable wifiStatusStreamWithFalseAfterTimeout = wifiStatusStream.timeout(
                // First item timeout delay.
                // @note took 18 ms to find out and emit activated wifi on
                //     manual test. tried w/ Android 8 HTC U11.
                Observable.empty().delay(30, TimeUnit.MILLISECONDS),
                // Other items' timeout delays (none).
                isWifiActive -> Observable.never(),
                // Fallback stream in case of timeout (keep the same stream +
                // default false value).
                wifiStatusStream.startWithItem(false)
        );

        return wifiStatusStreamWithFalseAfterTimeout;
    }

    private static Observable<Boolean> streamWifiStatusFromBroadcastListener(final Context context_, AbstractLogger log) {
        log.t();

        // Listen to network wifi connectivity status on API lt21. This doesn't
        // check for internet connectivity.
        // cf. https://stackoverflow.com/a/5890104/939741
        // @todo forward onError to false.
        // @todo !! TEST WHETHER IT TRIGGERS FIRST EVENT ON REGISTER OR NOT !!
        return Observable.create(emitter -> {
            // Retrieve connectivity service to register our wifi status
            // listener to.
            //
            // @note
            // ApplicationContext over service context recommended to avoid
            // memory leak bug on at least android 4.2 and 5.x.
            // cf. https://issuetracker.google.com/issues/36964970
            final Context context = context_.getApplicationContext();

            // Build android wifi status listener and forward result to
            // rxjava's stream.
            final IntentFilter filter = new IntentFilter();
            filter.addAction(ConnectivityManager.CONNECTIVITY_ACTION);
            filter.addAction(WifiManager.NETWORK_STATE_CHANGED_ACTION);

            BroadcastReceiver wifiStatusListener = new BroadcastReceiver() {
                @Override
                public void onReceive(final Context context, final Intent intent) {
                    log.t();

                    // Check intent/action string is not null for safety,
                    // although I see no reason why it would ever be the case.
                    // @warning onError will close the stream & the broadcast
                    //     listener and thus prevent further events to be
                    //     received. Stream has to be resubscribed on error,
                    //     likely through rxjava retry methods.
                    String action = intent.getAction();
                    if (action == null) {
                        if (!emitter.isDisposed()) {
                            emitter.onError(new IllegalStateException("Broadcast intent with empty action."));
                        }
                        return;
                    }

                    // Use NETWORK_STATE_CHANGED_ACTION to see if wifi is
                    // connected, as CONNECTIVITY_ACTION triggers events twice.
                    // @warning sometimes, connection event is broadcasted
                    // a short while before network is effectively on.
                    // cf. https://stackoverflow.com/a/5890104/939741
                    if (action.equals(WifiManager.NETWORK_STATE_CHANGED_ACTION)) {
                        NetworkInfo networkInfo = intent.getParcelableExtra(WifiManager.EXTRA_NETWORK_INFO);

                        log.v("NETWORK_STATE_CHANGED_ACTION");

                        // Prevent extremely rare crash due to null extra.
                        // @warning extremely rare reported case of null extra.
                        // cf. https://stackoverflow.com/a/5890104/939741
                        if (networkInfo == null) {
                            log.v("NETWORK_STATE_CHANGED_ACTION -> empty EXTRA_NETWORK_INFO");
                            if (!emitter.isDisposed()) {
                                emitter.onError(new IllegalArgumentException("NETWORK_STATE_CHANGED_ACTION has empty EXTRA_NETWORK_INFO"));
                            }
                            return;
                        }

                        // Wifi is connected.
                        // @warning two events triggered as well, but with
                        // different networkInfo (one seems to contain wifi
                        // type while the other the connection).
                        // cf. https://stackoverflow.com/a/5890104/939741
                        if (networkInfo.isConnected()) {
                            log.v("NETWORK_STATE_CHANGED_ACTION -> isConnected");
                            if (!emitter.isDisposed()) {
                                emitter.onNext(true);
                            }
                        }
                    }
                    // Use CONNECTIVITY_ACTION to know if wifi is disconnected,
                    // as NETWORK_STATE_CHANGED_ACTION doesn't trigger wifi
                    // disconnection events.
                    // cf. https://stackoverflow.com/a/5890104/939741
                    else if (action.equals(ConnectivityManager.CONNECTIVITY_ACTION)) {
                        NetworkInfo networkInfo = intent.getParcelableExtra(ConnectivityManager.EXTRA_NETWORK_INFO);

                        log.v("CONNECTIVITY_ACTION");

                        // Prevent extremely rare crash due to null extra.
                        // @warning extremely rare reported case of null extra.
                        // cf. https://stackoverflow.com/a/5890104/939741
                        if (networkInfo == null) {
                            log.v("CONNECTIVITY_ACTION -> empty EXTRA_NETWORK_INFO");
                            if (!emitter.isDisposed()) {
                                emitter.onError(new IllegalArgumentException("CONNECTIVITY_ACTION has empty EXTRA_NETWORK_INFO"));
                            }
                            return;
                        }

                        // Wifi is disconnected.
                        // @warning could potentially trigger false negative
                        // (disconnected) in case of low battery (<15/20%) with
                        // app switched to background with switch from WIFI to
                        // 3G, but we shouldn't have the issue, as we only
                        // consider WIFI connection and are not interested on
                        // checking connection consistency between WIFI <-> 3G.
                        // cf. https://stackoverflow.com/questions/34884442/android-checking-network-connectivity-return-not-connected-when-connected-to-wi/45231746#45231746
                        if (networkInfo.getType() == ConnectivityManager.TYPE_WIFI && !networkInfo.isConnected()) {
                            log.v("CONNECTIVITY_ACTION -> TYPE_WIFI + NOT isConnected");
                            if (!emitter.isDisposed()) {
                                emitter.onNext(false);
                            }
                        }
                    }
                }
            };

            // Register wifi status change's listener.
            context.registerReceiver(wifiStatusListener, filter);

            // Unregister wifi status change listener when stream is no longer
            // listened to.
            emitter.setCancellable(() -> context.unregisterReceiver(wifiStatusListener));
        });
    }

    static public @NonNull Observable<Boolean> stream(final Context context, AbstractLogger log) {
        // @todo refcount.
        _log = log;
        log.t();

        if (Build.VERSION.SDK_INT >= 21) {
            return streamWifiStatusFromNetworkCapabilities(context);
        }
        else {
            return streamWifiStatusFromBroadcastListener(context);
        }
    }

    /*
    static public boolean get(final Context context_) {
        // @warning requires android.permission.ACCESS_WIFI_STATE
        if (Build.VERSION.SDK_INT >= 21) {
            final Context context = context_.getApplicationContext();
            final String service = Context.CONNECTIVITY_SERVICE;
            final ConnectivityManager connectivityManager = (ConnectivityManager) context.getSystemService(service);

            // @warning
            // getNetworkCapabilities first requires to retrieve the Network
            // instance to gather data from getActiveNetwork, which
            // requires API 23+.
            //
            // @warning
            // requestNetwork is asynchronous, does switch to the specified
            // network (and involve related network switch permissions such as
            // CHANGE_NETWORK_STATE).
            //
            // @warning
            // getNetworkInfo is deprecated API 23+.
            // TYPE_WIFI is deprecated API 28+.
            //
            // @warning
            // getConnectionInfo + wifiManager.isWifiEnabled() now requires
            // location permission and location mode turned on (API 29+).
            // cf. https://issuetracker.google.com/issues/136021574
            // cf. https://stackoverflow.com/questions/3841317/how-do-i-see-if-wi-fi-is-connected-on-android#comment100128200_34904367
            //
            // @warning
            // registerNetworkCallback as suggested here
            // https://medium.com/swlh/how-to-check-internet-connection-on-android-q-ea7c5a103e3
            // doesn't trigger initial status for us, only update ones.

            // connectivityManager.getNetworkCapabilities();
        }
        else {

        }
    }
    */
}

// @todo Need to listen to doze as well cf. https://github.com/pwittchen/ReactiveNetwork/issues/115
/*
static private Observable<Boolean> dozeStatus(final Context context) {
    final IntentFilter filter = new IntentFilter(PowerManager.ACTION_DEVICE_IDLE_MODE_CHANGED);
    context.registerReceiver(idleReceiver, filter);
    context.unregisterReceiver(idleReceiver);

    // @todo ...
}
*/
