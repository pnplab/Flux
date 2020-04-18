package org.pnplab.phenotype.acquisition;

import android.os.Build;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.TimeUnit;

import io.reactivex.rxjava3.annotations.NonNull;
import io.reactivex.rxjava3.core.Flowable;

public class Ping {

    public static class PingTimePoint {
        public PingTimePoint(String time) {
            this.time = time;
        }

        public final String time;
    }

    private static @NonNull Flowable<PingTimePoint> _pingStream = Flowable
            .interval(1, TimeUnit.SECONDS)
            .map(q -> {
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
                return new PingTimePoint(timestamp + withDateTime);
            })
            .publish()
            .refCount();

    // Reference-counted rabbitmq connection. Does not retrigger at
    // subscription.
    public static Flowable<PingTimePoint> stream() {
        return _pingStream;
    }
}
