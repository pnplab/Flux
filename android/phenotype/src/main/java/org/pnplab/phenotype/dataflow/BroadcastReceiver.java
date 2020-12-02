package org.pnplab.phenotype.dataflow;

import android.content.Context;
import android.content.Intent;
import android.os.PowerManager;

import org.pnplab.phenotype.Phenotype;
import org.pnplab.phenotype.core.AbstractInitProvider;
import org.pnplab.phenotype.logger.AbstractLogger;

import static org.pnplab.phenotype.Phenotype.Phenotype;

/**
 * @note We do not use WakefulBroadcastReceiver as it's been deprecated and is
 * not compatible with the startForegroundService method while we believe its
 * behavior can be replaced with manual wakelock registering in all case.
 */
public class BroadcastReceiver extends android.content.BroadcastReceiver {

    private final AbstractLogger _log = AbstractInitProvider.getLogger();

    @Override
    public void onReceive(Context context, Intent intent) {
        _log.initialize(context);

        _log.t();

        String actionName = intent.getAction();

        // Returns directly if intent hasn't any action and thus we can't
        // retrieve the event type.
        if (actionName == null) {
            _log.v("Broadcast receiver received with null intent.");
            return;
        }
        // When phone boots.
        else if (actionName.equals("android.intent.action.BOOT_COMPLETED")) {
            _log.d("Broadcast receiver BOOT_COMPLETED received.");

            // @warning
            // BOOT_COMPLETE is sent to applications before external storage is
            // mounted. So if application is installed to external storage it
            // won't receive BOOT_COMPLETE broadcast message.

            // Force the device to stay awake until the service has started.
            // Then release the wakelock as it's now service's responsibility
            // to manage this kind of privilege. Set a wakelock timeout to
            // 5s for safety. This equals to the ANR timeout delay and the
            // maximum delay allowed for a service to go foreground before
            // being killed by android, thus it's a safe delay.
            PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (powerManager == null) {
                // Double check powerManager exists. This should always be the
                // case. getSystemService may return null for instant apps on
                // certain types of system services, which shouldn't be the
                // case here.
                throw new IllegalStateException("System refused access to POWER_SERVICE.");
            }
            PowerManager.WakeLock wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "phenotype:BOOT_COMPLETED");
            _log.v("acquire wakeLock phenotype:BOOT_COMPLETED for 5000ms");
            wakeLock.acquire(5000);

            // Start the phenotyping service.
            // @warning We must use application context because android prevent
            //     service binding from BroadcastReceiver's one. This is hacky.
            // @todo Launch service through start[Foreground]Service with
            //     custom intent in order to keep correct state.
            // cf. https://stackoverflow.com/a/34752888/939741
            // cf. https://developer.android.com/reference/android/content/Context.html#bindService(android.content.Intent,%20android.content.ServiceConnection,%20int)
            Phenotype.initialize(context.getApplicationContext());
            Phenotype((phenotype, unbind) -> {
                boolean isRunning = phenotype.isBackgroundModeStarting() || phenotype.isBackgroundModeStarted();
                if (isRunning) {
                    // Service is already running although we've just started
                    // the device. That should not happen.
                    _log.e("Service already running although the device has just booted.");
                }
                else {
                    _log.i("Starting phenotyping service at boot.");
                    phenotype.startBackgroundMode(() -> {
                        // Release wakelock once service has started.
                        _log.v("release wakeLock phenotype:BOOT_COMPLETED");
                        wakeLock.release();

                        // Stop phenotype binding.
                        unbind.run();
                    }, error -> {
                        // Release wakelock if service has failed to start. This
                        // callback is likely to be called after wakelock
                        // release timeout.
                        if (wakeLock.isHeld()) {
                            _log.v("release wakeLock phenotype:BOOT_COMPLETED");
                            wakeLock.release();
                        }

                        // Stop phenotype binding.
                        unbind.run();
                    });
                }
            }, error -> {
                // Release wakelock if service has failed to stream connected to.
                _log.v("release wakeLock phenotype:BOOT_COMPLETED");
                wakeLock.release();
            });
        }
        // When some htc devices fast boots.
        else if (actionName.equals("android.intent.action.QUICKBOOT_POWERON")) {
            _log.d("Broadcast receiver QUICKBOOT_POWERON received.");

            // @warning
            // QUICKBOOT_POWERON is a fast boot intent sent by HTC devices.
            // cf. https://stackoverflow.com/a/26026471/939741

            // Although it seems to be triggered for HTC fast boots which could
            // keep the service cached while the device is off.
            // @todo Test service is off when QUICKBOOT_POWERON is called on HTC devices.
            // cf. https://stackoverflow.com/questions/2784441/trying-to-start-a-service-on-boot-on-android#comment50779775_16542461

            // Force the device to stay awake until the service has started.
            // Then release the wakelock and as its now service's
            // responsibility to manage this kind of privilege. Set a wakelock
            // timeout to 5s for safety. This equals to the ANR timeout delay
            // and the maximum delay allowed for a service to go foreground
            // before being killed by android, thus it's a safe delay.
            PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (powerManager == null) {
                // Double check powerManager exists. This should always be the
                // case. getSystemService may return null for instant apps on
                // certain types of system services, which shouldn't be the
                // case here.
                throw new IllegalStateException("System refused access to POWER_SERVICE.");
            }
            PowerManager.WakeLock wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "phenotype:QUICKBOOT_POWERON");
            _log.v("acquire wakeLock phenotype:QUICKBOOT_POWERON for 5000ms");
            wakeLock.acquire(5000);

            // Start the phenotyping service.
            // @warning We must use application context because android prevent
            //     service binding from BroadcastReceiver's one. This is hacky.
            // @todo Launch service through start[Foreground]Service with
            //     custom intent in order to keep correct state.
            // cf. https://stackoverflow.com/a/34752888/939741
            // cf. https://developer.android.com/reference/android/content/Context.html#bindService(android.content.Intent,%20android.content.ServiceConnection,%20int)
            Phenotype.initialize(context.getApplicationContext());
            Phenotype((phenotype, unbind) -> {
                boolean isRunning = phenotype.isBackgroundModeStarting() || phenotype.isBackgroundModeStarted();
                if (isRunning) {
                    // Service is already running although we've just started
                    // the device. That should not happen.
                    _log.e("Service already running although the device has just booted. This might be due to QUICKBOOT_POWERON.");
                }
                else {
                    _log.i("Starting phenotyping service at boot.");
                    phenotype.startBackgroundMode(() -> {
                        // Release wakelock once service has started.
                        _log.v("release wakeLock phenotype:QUICKBOOT_POWERON");
                        wakeLock.release();

                        // Stop phenotype binding.
                        unbind.run();
                    }, error -> {
                        // Release wakelock if service has failed to start. This
                        // callback is likely to be called after wakelock
                        // release timeout.
                        if (wakeLock.isHeld()) {
                            _log.v("release wakeLock phenotype:QUICKBOOT_POWERON");
                            wakeLock.release();
                        }

                        // Stop phenotype binding.
                        unbind.run();
                    });
                }
            }, error -> {
                // Release wakelock if service has failed to stream connected to.
                _log.v("release wakeLock phenotype:QUICKBOOT_POWERON");
                wakeLock.release();
            });
        }
    }

}
