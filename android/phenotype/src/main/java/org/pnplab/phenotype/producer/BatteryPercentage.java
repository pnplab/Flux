package org.pnplab.phenotype.producer;

import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.BatteryManager;
import android.os.Build;

import org.jetbrains.annotations.NotNull;
import org.pnplab.phenotype.logger.AbstractLogger;

import io.reactivex.rxjava3.core.Flowable;

public class BatteryPercentage {


    public static class BatteryPercentageTimePoint {
        public long timestamp;
        public float batteryPercentage;

        public BatteryPercentageTimePoint(long timestamp, float batteryPercentage) {
            this.timestamp = timestamp;
            this.batteryPercentage = batteryPercentage;
        }
    }

    private static Flowable<BatteryPercentageTimePoint> _stream = null;

    public static BatteryPercentageTimePoint get(Context context, @NotNull AbstractLogger log) {
        // Retrieve current time.
        long timestamp = System.currentTimeMillis();

        // Retrieve battery level from battery service.
        // cf. https://stackoverflow.com/a/42327441/939741
        float batteryPercentage = -1;
        if (Build.VERSION.SDK_INT >= 21) {
            BatteryManager bm = (BatteryManager) context.getSystemService(Context.BATTERY_SERVICE);

            if (bm == null) {
                // ...should not happen as we're not running
                // an instant service and BATTERY_SERVICE is
                // enabled by instant service. But for safety,
                // we throw an exception.
                // @todo move out of generator!
                throw new IllegalStateException("Unable to retrieve battery service.");
            }

            int batteryPercentageInt = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY);

            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P && batteryPercentageInt == 0) {
                // ...BATTERY_PROPERTY_CAPACITY has not been
                // found in SDK lt28, fallback to the intent
                // filter method.
            }
            else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P && batteryPercentageInt == Integer.MIN_VALUE) {
                // ...BATTERY_PROPERTY_CAPACITY has not been
                // found in SDK 28+, fallback to intent
                // filter method.
            }
            else {
                batteryPercentage = 0.01f * batteryPercentageInt;
            }
        }

        // Retrieve battery level from intent extra.
        // cf. https://developer.android.com/training/monitoring-device-state/battery-monitoring.html
        if (Build.VERSION.SDK_INT < 21 || batteryPercentage == -1) {
            IntentFilter intentFilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
            Intent batteryStatus = context.registerReceiver(null, intentFilter);

            if (batteryStatus != null) {
                int batteryLevel = batteryStatus.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
                int batteryScale = batteryStatus.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
                batteryPercentage = batteryLevel / (float) batteryScale;
            }
        }

        // Forward error if we weren't able to retrieve battery
        // percentage.
        if (batteryPercentage == -1) {
            throw new UnsupportedOperationException("Unable to retrieve battery level");
        }

        // Forward battery level.
        BatteryPercentageTimePoint timepoint = new BatteryPercentageTimePoint(timestamp, batteryPercentage);
        return timepoint;
    }

    public static Flowable<BatteryPercentageTimePoint> stream(Context context, @NotNull AbstractLogger log) {
        // Return cached stream if exists.
        if (BatteryPercentage._stream != null) {
            return BatteryPercentage._stream;
        }
        // Generate cached stream and then return otherwise.
        else {
            BatteryPercentage._stream = Flowable
                .generate(emitter -> {
                    // Retrieve current time.
                    long timestamp = System.currentTimeMillis();

                    // Retrieve battery level from battery service.
                    // cf. https://stackoverflow.com/a/42327441/939741
                    float batteryPercentage = -1;
                    if (Build.VERSION.SDK_INT >= 21) {
                        BatteryManager bm = (BatteryManager) context.getSystemService(Context.BATTERY_SERVICE);

                        if (bm == null) {
                            // ...should not happen as we're not running
                            // an instant service and BATTERY_SERVICE is
                            // enabled by instant service. But for safety,
                            // we throw an exception.
                            // @todo move out of generator!
                            emitter.onError(new IllegalStateException("Unable to retrieve battery service."));
                            return;
                        }

                        int batteryPercentageInt = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY);

                        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P && batteryPercentageInt == 0) {
                            // ...BATTERY_PROPERTY_CAPACITY has not been
                            // found in SDK lt28, fallback to the intent
                            // filter method.
                        }
                        else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P && batteryPercentageInt == Integer.MIN_VALUE) {
                            // ...BATTERY_PROPERTY_CAPACITY has not been
                            // found in SDK 28+, fallback to intent
                            // filter method.
                        }
                        else {
                            batteryPercentage = 0.01f * batteryPercentageInt;
                        }
                    }

                    // Retrieve battery level from intent extra.
                    // cf. https://developer.android.com/training/monitoring-device-state/battery-monitoring.html
                    if (Build.VERSION.SDK_INT < 21 || batteryPercentage == -1) {
                        IntentFilter intentFilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
                        Intent batteryStatus = context.registerReceiver(null, intentFilter);

                        if (batteryStatus != null) {
                            int batteryLevel = batteryStatus.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
                            int batteryScale = batteryStatus.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
                            batteryPercentage = batteryLevel / (float) batteryScale;
                        }
                    }

                    // Forward error if we weren't able to retrieve battery
                    // percentage.
                    if (batteryPercentage == -1) {
                        emitter.onError(new UnsupportedOperationException("Unable to retrieve battery level"));
                        return;
                    }

                    // Forward battery level.
                    BatteryPercentageTimePoint timepoint = new BatteryPercentageTimePoint(timestamp, batteryPercentage);
                    emitter.onNext(timepoint);
                });

            // return stream.
            return BatteryPercentage._stream;
        }

    }
}
