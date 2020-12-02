package org.pnplab.phenotype.producer;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorManager;
import android.hardware.TriggerEvent;
import android.hardware.TriggerEventListener;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;

import org.pnplab.phenotype.logger.AbstractLogger;

import io.reactivex.rxjava3.core.BackpressureStrategy;
import io.reactivex.rxjava3.core.Flowable;

import static android.content.Context.SENSOR_SERVICE;

public class SignificantMotion {

    public static class SignificantMotionTimePoint {
        public final long timestamp;

        public SignificantMotionTimePoint(long timestamp) {
            this.timestamp = timestamp;
        }
    }

    // @todo cache stream
    public static Flowable<SignificantMotionTimePoint> stream(Context context, AbstractLogger log) {
        AbstractLogger _log = log;
        SensorManager _sensorManager = (SensorManager) context.getSystemService(SENSOR_SERVICE); // @todo context -> OUT
        final Sensor _significantMotion = _sensorManager.getDefaultSensor(Sensor.TYPE_SIGNIFICANT_MOTION);

        boolean isWakeUp = true; // unknown.. @todo know!
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            isWakeUp = _significantMotion.isWakeUpSensor();
        }
        int maxEventCount = _significantMotion.getFifoMaxEventCount();
        int frequency = 50;
        int maxReportLatencyUs = (1000000 / frequency) * maxEventCount;
        _log.i("sm:isWakeUp:" + isWakeUp);
        _log.i("sm:frequency:" + frequency);
        _log.i("sm:maxEventCount:" + maxEventCount);
        _log.i("sm:maxReportLatencyUs:" + maxReportLatencyUs);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            int reportingMode = _significantMotion.getReportingMode();
            if (reportingMode == Sensor.REPORTING_MODE_ONE_SHOT) {
                _log.i("sm:reportingMode:oneShot");
            }
            else {
                _log.i("sm:reportingMode:" + reportingMode);
            }
        }

        // @question from that.

        return Flowable
            .create(producer -> {

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

                final TriggerEventListener triggerEventListener = new TriggerEventListener() {
                    @Override
                    public void onTrigger(TriggerEvent event) {
                        // @warning
                        // #requestTriggerSensor seems to trigger on main
                        // thread looper and provides no API to override that
                        // behavior. Thus we need to manually override this
                        // behavior by manually forwarding code execution to
                        // subscribed thread's looper (has been found out
                        // through NetworkOnMainThreadException triggered while
                        // subscribeOn w/ looper was set for the stream, doc is
                        // empty about this, while android code seems to
                        // confirm.).
                        handler.post(() -> {
                            // Bypass event if producer has already been canceled (
                            // cf. if the subscriber(s) has(/ve) been undisposed).
                            if (producer.isCancelled()) {
                                return;
                            }

                            // Forward event into flowable.
                            SignificantMotionTimePoint significantMotionTimePoint = new SignificantMotionTimePoint(event.timestamp);
                            producer.onNext(significantMotionTimePoint);

                            // Loop trigger.
                            try {
                                boolean requestSucceed = _sensorManager.requestTriggerSensor(this, _significantMotion);

                                // End flowable when the event request loop fails, just
                                // for cleaness.
                                if (!requestSucceed) {
                                    producer.onError(new RuntimeException("requestTriggerSensor for significant motion has failed"));
                                }
                            }
                            catch (Exception e) {
                                // End flowable when the event request loop fails, just
                                // for cleaness.
                                producer.onError(e);
                            }
                        });
                    }
                };

                try {
                    boolean requestSucceed = _sensorManager.requestTriggerSensor(triggerEventListener, _significantMotion);

                    _log.i("sm:requestSucceed: " + requestSucceed);

                    // End flowable when the event request loop fails, just
                    // for cleaness.
                    if (!requestSucceed) {
                        producer.onError(new RuntimeException("requestTriggerSensor for significant motion has failed"));
                    }
                } catch (Exception e) {
                    _log.i("sm:requestSucceed: false");

                    // End flowable when the event request loop fails, just
                    // for cleaness.
                    producer.onError(e);
                }

                producer.setCancellable(() -> {
                    _sensorManager.cancelTriggerSensor(triggerEventListener, _significantMotion);
                });
            }, BackpressureStrategy.BUFFER);
    }
}
