package org.pnplab.phenotype.generators;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;

import org.pnplab.phenotype.logger.AbstractLogger;

import io.reactivex.rxjava3.core.BackpressureStrategy;
import io.reactivex.rxjava3.core.Flowable;

import static android.content.Context.SENSOR_SERVICE;

public class Accelerometer {

    public static abstract class AccelerometerEvent {

    }

    public static class AccelerometerTimePoint extends AccelerometerEvent {
        public final long timestamp; // event (hardware?) induced timestamp
        public final int accuracy;
        public final float x;
        public final float y;
        public final float z;

        public AccelerometerTimePoint(long timestamp, int accuracy, float x, float y, float z) {
            this.timestamp = timestamp;
            this.accuracy = accuracy;
            this.x = x;
            this.y = y;
            this.z = z;
        }
    }

    public static class AccelerometerAccuracyTimePoint extends AccelerometerEvent {
        public final long timestamp;
        public final int accuracy;

        public AccelerometerAccuracyTimePoint(long timestamp, int accuracy) {
            this.timestamp = timestamp; // software (currentTimeMillis) induced timestamp
            this.accuracy = accuracy;
        }
    }

    // @todo cache
    public static Flowable<AccelerometerEvent> stream(Context context, AbstractLogger log) {
        AbstractLogger _log = log;
        SensorManager _sensorManager = (SensorManager) context.getSystemService(SENSOR_SERVICE); // @todo context -> OUT
        // @note Gravity is included in measure.
        // @note We could use TYPE_ACCELEROMETER_UNCALIBRATED instead
        //    which removes software calibration, but still includes
        //    temperature and factory calibration.
        final Sensor _accelerometer = _sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);

        return Flowable
            .<AccelerometerEvent>create(producer -> {
                boolean isWakeUp = false; // unknown.. should be false by default though @todo know!
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    isWakeUp = _accelerometer.isWakeUpSensor();
                }
                /*
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    // @note _sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER, true) returns null.
                    List<Sensor> dynamicSensorList = _sensorManager.getDynamicSensorList(Sensor.TYPE_ACCELEROMETER);
                    for (Sensor dynamicSensor : dynamicSensorList) {
                        if (dynamicSensor.isWakeUpSensor()) {
                            _accelerometer = dynamicSensor;
                            isWakeUp = true;
                        }
                    }
                }
                */
                int maxEventCount = _accelerometer.getFifoMaxEventCount();
                int frequency = 50;
                int maxReportLatencyUs = (1000000 / frequency) * maxEventCount;
                _log.i("accelerometer:isWakeUp:" + isWakeUp);
                _log.i("accelerometer:frequency:" + frequency);
                _log.i("accelerometer:maxEventCount:" + maxEventCount);
                _log.i("accelerometer:maxReportLatencyUs:" + maxReportLatencyUs);

                // @warning registerListener requires an android Handler (and
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

                SensorEventListener sensorEventListener = new SensorEventListener() {
                    @Override
                    public void onSensorChanged(SensorEvent event) {
                        // Forward event into flowable.
                        if (!producer.isCancelled()) {
                            AccelerometerTimePoint timepoint = new AccelerometerTimePoint(
                                    event.timestamp,
                                    event.accuracy,
                                    event.values[0],
                                    event.values[1],
                                    event.values[2]
                            );
                            producer.onNext(timepoint);
                        }
                    }

                    @Override
                    public void onAccuracyChanged(Sensor sensor, int accuracy) {
                        if (!producer.isCancelled()) {
                            long timestamp = System.currentTimeMillis();
                            AccelerometerAccuracyTimePoint event = new AccelerometerAccuracyTimePoint(
                                    timestamp,
                                    accuracy
                            );
                            producer.onNext(event);
                        }
                    }
                };

                // Stop the sensor listener when the flowable is unsubscribed.
                producer.setCancellable(() -> {
                    _sensorManager.unregisterListener(sensorEventListener);
                });

                // Register the sensor listener.
                boolean requestSucceed = _sensorManager.registerListener(sensorEventListener, _accelerometer, 1000000 / frequency, handler);
                log.i("accelerometer:requestSucceed:" + requestSucceed);
            }, BackpressureStrategy.BUFFER)
            .publish()
            .refCount();
            /*
            .buffer(frequency)
            .subscribe(events -> {
                events.forEach(event -> {
                    // SystemClock.elapsedRealtimeNanos()
                    long timestamp = System.currentTimeMillis();
                    // _log.v("" + timestamp + " " + event.timestamp + " " + event.values[0] + " " + event.values[1] + " " + event.values[2]);
                    try {
                        ByteBuffer buffer = ByteBuffer.allocate(1 * 8 + 3 * 4); // Always big endian by default
                        buffer.putLong(timestamp);
                        buffer.putFloat(event.values[0]);
                        buffer.putFloat(event.values[1]);
                        buffer.putFloat(event.values[2]);
                        channel.basicPublish("", "accelerometer", null, buffer.array());
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                });
            });
             */
            /*
            .subscribe(event -> {
                // SystemClock.elapsedRealtimeNanos()
                long timestamp = System.currentTimeMillis();
                // _log.v("" + timestamp + " " + event.timestamp + " " + event.values[0] + " " + event.values[1] + " " + event.values[2]);
                // try {
                    ByteBuffer buffer = ByteBuffer.allocate(1 * 8 + 3 * 4); // Always big endian by default
                    buffer.putLong(timestamp);
                    buffer.putFloat(event.values[0]);
                    buffer.putFloat(event.values[1]);
                    buffer.putFloat(event.values[2]);
                    // channel.basicPublish("", "accelerometer", null, buffer.array());
                // } catch (IOException e) {
                //     e.printStackTrace();
                // }
            });
            */

        // @todo pipe that in remote storage until we see worker queue to flush local storage into remote storage!
        // @warning we still want real time communication
        // @todo pipe that in local storage!
    }
}
