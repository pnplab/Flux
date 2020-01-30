package org.pnplab.phenotype.system.entrypoints;

import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.hardware.TriggerEvent;
import android.hardware.TriggerEventListener;
import android.os.Build;
import android.os.Handler;
import android.os.HandlerThread;

import org.pnplab.phenotype.logger.AbstractLogger;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

// @todo
// 1. upload on server to Timeseries Db
// 2. check sensors missing timepoints through visualisation.

// https://developer.android.com/topic/performance/power/setup-battery-historian
// https://developer.android.com/topic/performance/power/battery-historian
public class DefaultPhenotypeService extends AbstractPhenotypeService {
    // int numberOfCores = Runtime.getRuntime().availableProcessors();
    // ThreadPoolExecutor taskExecutor = new ThreadPoolExecutor(numberOfCores, 32, 5000, TimeUnit.MILLISECONDS, new ArrayBlockingQueue<Runnable>(50));
    // executor.setRejectedExecutionHandler
    // https://medium.com/@frank.tan/using-a-thread-pool-in-android-e3c88f59d07f
    // https://medium.com/@frank.tan/using-handlerthread-in-android-46c285936fdd
    // taskExecutor.prestartAllCoreThreads();
    // taskExecutor.awaitTermination();

    final AbstractLogger _log = AbstractPhenotypeInitProvider.getLogger();

    Thread _engineThread = new Thread(() -> {
        // Ping service every 5 seconds and report to log.
        while (!Thread.currentThread().isInterrupted()) {
            String timestamp = "" + System.currentTimeMillis();

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss");
                LocalDateTime now = LocalDateTime.now();
                timestamp += " " + dtf.format(now);
            }

            _log.v(timestamp + " ping service");
            try {
                Thread.sleep(5000);
            } catch (InterruptedException e) {

            }
        }
    });


    @Override
    protected void _onStartEngine() {
        _engineThread.start();
        // https://developer.android.com/guide/components/broadcast-exceptions
        // https://developer.android.com/reference/java/util/concurrent/ThreadPoolExecutor.html

        HandlerThread sensorThread = new HandlerThread("PhenotypeEngine");
        sensorThread.start();
        Handler sensorThreadHandler = new Handler(sensorThread.getLooper());

        SensorManager _sensorManager = (SensorManager) getSystemService(SENSOR_SERVICE);

        {
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
            final TriggerEventListener triggerEventListener = new TriggerEventListener() {
                @Override
                public void onTrigger(TriggerEvent event) {
                    String timestamp = "" + System.currentTimeMillis();
                    long evtTimestamp = event.timestamp;
                    _log.v("sm " + timestamp + " " + event.timestamp + " " + event.values.length + " " + event.values[0]);
                    // loop trigger
                    _sensorManager.requestTriggerSensor(this, _significanMotion);
                }
            };
            boolean requestSucceed = _sensorManager.requestTriggerSensor(triggerEventListener, _significanMotion);
            _log.i("sm:requestSucceed:" + requestSucceed);
        }

        {
            Sensor _accelerometer = _sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
            boolean isWakeUp = false; // unknown.. @todo know!
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
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                isWakeUp = _accelerometer.isWakeUpSensor();
            }
            int maxEventCount = _accelerometer.getFifoMaxEventCount();
            int frequency = 50;
            int maxReportLatencyUs = (1000000 / frequency) * maxEventCount;
            _log.i("accelerometer:isWakeUp:" + isWakeUp);
            _log.i("accelerometer:frequency:" + frequency);
            _log.i("accelerometer:maxEventCount:" + maxEventCount);
            _log.i("accelerometer:maxReportLatencyUs:" + maxReportLatencyUs);

            _sensorManager.registerListener(new SensorEventListener() {
                @Override
                public void onSensorChanged(SensorEvent event) {
                    String timestamp = "" + System.currentTimeMillis();
                    _log.v("" + timestamp + " " + event.timestamp + " " + event.values[0] + " " + event.values[1] + " " + event.values[2]);
                }

                @Override
                public void onAccuracyChanged(Sensor sensor, int accuracy) {

                }
            }, _accelerometer, 1000000 / frequency, sensorThreadHandler);
        }
    }

    @Override
    protected void _onStopEngine() {
        _engineThread.interrupt();
    }
}
