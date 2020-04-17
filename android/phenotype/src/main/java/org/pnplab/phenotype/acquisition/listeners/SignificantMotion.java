package org.pnplab.phenotype.acquisition.listeners;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorManager;
import android.hardware.TriggerEvent;
import android.hardware.TriggerEventListener;
import android.os.Build;

import org.pnplab.phenotype.logger.AbstractLogger;

import io.reactivex.rxjava3.core.BackpressureStrategy;
import io.reactivex.rxjava3.core.Flowable;

import static android.content.Context.SENSOR_SERVICE;

public class SignificantMotion {

    void run(Context context, AbstractLogger log) {
        AbstractLogger _log = log;
        SensorManager _sensorManager = (SensorManager) context.getSystemService(SENSOR_SERVICE); // @todo context -> OUT
        final Sensor _significanMotion = _sensorManager.getDefaultSensor(Sensor.TYPE_SIGNIFICANT_MOTION);

        boolean isWakeUp = true; // unknown.. @todo know!
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            isWakeUp = _significanMotion.isWakeUpSensor();
        }
        int maxEventCount = _significanMotion.getFifoMaxEventCount();
        int frequency = 50;
        int maxReportLatencyUs = (1000000 / frequency) * maxEventCount;
        _log.i("sm:isWakeUp:" + isWakeUp);
        _log.i("sm:frequency:" + frequency);
        _log.i("sm:maxEventCount:" + maxEventCount);
        _log.i("sm:maxReportLatencyUs:" + maxReportLatencyUs);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            int reportingMode = _significanMotion.getReportingMode();
            if (reportingMode == Sensor.REPORTING_MODE_ONE_SHOT) {
                _log.i("sm:reportingMode:oneShot");
            }
            else {
                _log.i("sm:reportingMode:" + reportingMode);
            }
        }

        // @question from that.

        // @todo drop without buffer - interpolation strategy to recover.
        Flowable
            .<TriggerEvent>create(producer -> {
                final TriggerEventListener triggerEventListener = new TriggerEventListener() {
                    @Override
                    public void onTrigger(TriggerEvent event) {
                        // Bypass event if producer has already been canceled (
                        // cf. if the subscriber(s) has(/ve) been undisposed).
                        if (producer.isCancelled()) {
                            return;
                        }

                        // Forward event into flowable.
                        producer.onNext(event);

                        // Loop trigger.
                        // @todo find a way to put retrigger request
                        //     outside of flowable creation in order to
                        //     benefits sooner from flowable backpressure
                        //     management.
                        boolean requestSucceed = _sensorManager.requestTriggerSensor(this, _significanMotion);

                        // End flowable when the event request loop fails, just
                        // for cleaness.
                        if (!requestSucceed) {
                            producer.onError(new RuntimeException("requestTriggerSensor for significant motion has failed"));
                        }
                    }
                };
                boolean requestSucceed = _sensorManager.requestTriggerSensor(triggerEventListener, _significanMotion);
                _log.i("sm:requestSucceed:" + requestSucceed);
            }, BackpressureStrategy.DROP)
            .subscribe(event -> {
                String timestamp = "" + System.currentTimeMillis();
                long evtTimestamp = event.timestamp;
                _log.v("sm " + timestamp + " " + event.timestamp + " " + event.values.length + " " + event.values[0]);
            });

    }
}
