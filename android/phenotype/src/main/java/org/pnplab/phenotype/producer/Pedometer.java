package org.pnplab.phenotype.producer;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;

import org.jetbrains.annotations.NotNull;
import org.pnplab.phenotype.logger.AbstractLogger;

import io.reactivex.rxjava3.core.BackpressureStrategy;
import io.reactivex.rxjava3.core.Flowable;

/**
 * @todo read https://github.com/danielmurray/adaptiv for home-made pedometer
 * algo from accelerometer data within android app
 * @todo better algo https://www.ncbi.nlm.nih.gov/pubmed/29351223
 */
public class Pedometer {

    private static Flowable<PedometerDataPoint> _pedometerStream = null;

    public static class PedometerDataPoint {
        public final long timestamp; // ns since boot
        public final int count;

        public PedometerDataPoint(long timestamp, int count) {
            this.timestamp = timestamp;
            this.count = count;
        }
    }

    // step detector vs step counter.
    // -> step detector, returns single count since app boot with high precision + high latency (<10s)
    // -> step counter, returns continuous event trigger since recording with low precisoin + low latency (<2s).
    //
    // @warning both requires ACTIVITY_RECOGNITION permission on API 29+
    //
    // we use step counter as it is more accurate.
    public static Flowable<PedometerDataPoint> stream(@NotNull SensorManager sensorManager, @NotNull AbstractLogger log) {
        // Return cached stream if exists.
        if (Pedometer._pedometerStream != null) {
            return Pedometer._pedometerStream;
        }
        // Generate cached stream and then return otherwise.
        else {
            Pedometer._pedometerStream =
                Flowable
                    .<PedometerDataPoint>create(producer -> {
                        // @todo implement system feature checkup cf. GIST https://gist.github.com/dyadica/93438442857b1a93f19e.

                        final Sensor _stepCounter = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);

                        boolean isWakeUp = false; // unknown.. @todo know!
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                            isWakeUp = _stepCounter.isWakeUpSensor();
                        }
                        int maxEventCount = _stepCounter.getFifoMaxEventCount();
                        double frequency = 0.1; // hz
                        long maxReportLatencyUs = Math.round(1000000 / frequency) * maxEventCount;
                        // @note 100 000 uS for test, instead of 19hours..
                        maxReportLatencyUs = Math.min(100000, maxReportLatencyUs);
                        log.i("sc:isWakeUp:" + isWakeUp);
                        log.i("sc:frequency:" + frequency);
                        log.i("sc:maxEventCount:" + maxEventCount);
                        log.i("sc:maxReportLatencyUs:" + maxReportLatencyUs);

                        // @warning registerListener requires /usr/src/app/src/index.jsan android Handler (and
                        // thus an android Looper as well). A method signature without
                        // Handler exists, although we don't know whether it uses the
                        // the current thread looper or the main thread one.
                        // Thus, we do specify the current thread's looper and emit an
                        // error if none is available.
                        Looper currentThreadLooper = Looper.myLooper();

                        // Emit error if the current thread doesn't have a looper set
                        // up.
                        if (currentThreadLooper == null) {
                            if (!producer.isCancelled()) {
                                producer.onError(new IllegalStateException("Registering a sensor requires an Android Looper on the running thread."));
                            }
                        }

                        // Instantiate the message handler forwarding the events to
                        // the thread looper.
                        Handler handler = new Handler(currentThreadLooper);

                        final SensorEventListener sensorEventListener = new SensorEventListener() {
                            @Override
                            public void onSensorChanged(SensorEvent event) {
                                // Forward event into flowable.
                                // Bypass event if producer has already been
                                // canceled (cf. if the subscriber(s) has(/ve)
                                // been undisposed).
                                // @todo check float value to int.
                                PedometerDataPoint pedometerDataPoint = new PedometerDataPoint(event.timestamp, Float.valueOf(event.values[0]).intValue());
                                if (!producer.isCancelled()) {
                                    producer.onNext(pedometerDataPoint);
                                }
                            }

                            @Override
                            public void onAccuracyChanged(Sensor sensor, int accuracy) {
                                // @todo
                            }
                        };

                        boolean requestSucceed = sensorManager.registerListener(sensorEventListener, _stepCounter, Double.valueOf(1000000 / frequency).intValue(), handler);
                        log.i("sc:requestSucceed:" + requestSucceed);
                    }, BackpressureStrategy.BUFFER)
                    .publish()
                    .refCount();

            return Pedometer._pedometerStream;
        }
    }

}
