package org.pnplab.phenotype.producer;

import android.os.SystemClock;

import java.util.concurrent.TimeUnit;

import io.reactivex.rxjava3.annotations.NonNull;
import io.reactivex.rxjava3.core.Flowable;

public class Ping {

    public static class PingTimePoint {
        public final long currentTimeMs;
        public final long elapsedTimeMs;
        public final long uptimeMs;

        public PingTimePoint(long currentTimeMs, long elapsedTimeMs, long uptimeMs) {
            this.currentTimeMs = currentTimeMs;
            this.elapsedTimeMs = elapsedTimeMs;
            this.uptimeMs = uptimeMs;
        }

        /*
        @Override
        public String toString() {
            // Generate current timestamp value.
            String timestamp = "" + System.currentTimeMillis();

            // Generate current date time.
            String withDateTime = "";
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss");
                LocalDateTime now = LocalDateTime.now();
                withDateTime = " " + dtf.format(now);
            }

            // Return value.
            return timestamp + withDateTime;
        }
        */
    }

    private static @NonNull Flowable<PingTimePoint> _pingStream = Flowable
            .interval(0, 1, TimeUnit.SECONDS)
            .map(q -> {
                // Return value.
                // @todo
                // API 29 - SystemClock.currentGnssTimeClock()
                // API 24 - https://developer.android.com/reference/android/location/GnssClock
                return new PingTimePoint(
                        System.currentTimeMillis(),
                        SystemClock.elapsedRealtime(),
                        SystemClock.uptimeMillis()
                );
            })
            .publish()
            .refCount();

    // Reference-counted rabbitmq connection. Does not retrigger at
    // subscription.
    public static Flowable<PingTimePoint> stream() {
        return _pingStream;
    }
}
