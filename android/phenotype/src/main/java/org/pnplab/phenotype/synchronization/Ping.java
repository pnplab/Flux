package org.pnplab.phenotype.synchronization;

import android.os.Build;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.TimeUnit;

import io.reactivex.rxjava3.annotations.NonNull;
import io.reactivex.rxjava3.core.Flowable;

public class Ping {

    public static class PingTimepoint {
        public PingTimepoint(String time) {
            this.time = time;
        }

        public final String time;
    }

    private static @NonNull Flowable<PingTimepoint> _pingStream = Flowable
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
                return new PingTimepoint(timestamp + withDateTime);
            })
            .publish()
            .refCount();

    // Reference-counted rabbitmq connection. Does not retrigger at
    // subscription.
    public static Flowable<PingTimepoint> get() {
        return _pingStream;
    }
}
