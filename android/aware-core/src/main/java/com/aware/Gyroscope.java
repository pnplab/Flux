
package com.aware;

import android.content.BroadcastReceiver;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SyncRequest;
import android.database.Cursor;
import android.database.SQLException;
import android.database.sqlite.SQLiteException;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;

import com.aware.providers.Gyroscope_Provider;
import com.aware.providers.Gyroscope_Provider.Gyroscope_Data;
import com.aware.providers.Gyroscope_Provider.Gyroscope_Sensor;
import com.aware.utils.Aware_Sensor;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.Queue;

/**
 * Service that logs gyroscope readings from the device
 *
 * @author df
 */
public class Gyroscope extends Aware_Sensor implements SensorEventListener {

    /**
     * Logging tag (default = "AWARE::Gyroscope")
     */
    private static String TAG = "AWARE::Gyroscope";

    private static SensorManager mSensorManager;
    private static Sensor mGyroscope;

    private static HandlerThread sensorThread = null;
    private static Handler sensorHandler = null;
    private static PowerManager.WakeLock wakeLock = null;

    private static Float[] last_values = null;
    private static long lastTimestamp = 0;
    private static long LAST_SAVE = 0;

    private static int FREQUENCY = -1;
    private static double THRESHOLD = 0;
    // Reject any data points that come in more often than frequency
    private static boolean ENFORCE_FREQUENCY = false;

    /**
     * Broadcasted event: new gyroscope values
     * ContentProvider: Gyroscope_Provider
     */
    public static final String ACTION_AWARE_GYROSCOPE = "ACTION_AWARE_GYROSCOPE";
    public static final String EXTRA_SENSOR = "sensor";
    public static final String EXTRA_DATA = "data";

    public static final String ACTION_AWARE_GYROSCOPE_LABEL = "ACTION_AWARE_GYROSCOPE_LABEL";
    public static final String EXTRA_LABEL = "label";

    /**
     * Until today, no available Android phone samples higher than 208Hz (Nexus 7).
     * http://ilessendata.blogspot.com/2012/11/android-accelerometer-sampling-rates.html
     */
    private List<ContentValues> data_values = new ArrayList<>();

    private static String LABEL = "";

    private static DataLabel dataLabeler = new DataLabel();

    public static class DataLabel extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (intent.getAction().equals(ACTION_AWARE_GYROSCOPE_LABEL)) {
                LABEL = intent.getStringExtra(EXTRA_LABEL);
            }
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        //we log accuracy on the sensor changed values
    }

    Queue _avgQueue = new ArrayDeque();
    int _worstAccuracy = Integer.MAX_VALUE;
    @Override
    public void onSensorChanged(SensorEvent event) {
        if (SignificantMotion.isSignificantMotionActive && !SignificantMotion.CURRENT_SIGMOTION_STATE) {
            if (data_values.size() > 0) {
                final ContentValues[] data_buffer = new ContentValues[data_values.size()];
                data_values.toArray(data_buffer);
                try {
                    if (!Aware.getSetting(getApplicationContext(), Aware_Preferences.DEBUG_DB_SLOW).equals("true")) {
                        new Thread(new Runnable() {
                            @Override
                            public void run() {
                                getContentResolver().bulkInsert(Gyroscope_Provider.Gyroscope_Data.CONTENT_URI, data_buffer);

                                Intent newData = new Intent(ACTION_AWARE_GYROSCOPE);
                                sendBroadcast(newData);
                            }
                        }).run();
                    }
                } catch (SQLiteException e) {
                    if (Aware.DEBUG) Log.d(TAG, e.getMessage());
                } catch (SQLException e) {
                    if (Aware.DEBUG) Log.d(TAG, e.getMessage());
                }
                data_values.clear();
            }

            return;
        }

        // Ignore values popping faster than frequency rate.
        // @deprecated we now calculate average by default.
        long nowTimestamp = System.currentTimeMillis();
        if (ENFORCE_FREQUENCY && nowTimestamp < lastTimestamp + FREQUENCY / 1000)
            return;

        // Ignore values if the change is too small, in other word if the
        // delta with last timepoint is inferior to specific threshold. Doesn't
        // apply to the very first round of value since no delta can be
        // generated by definition.
        if (last_values != null && THRESHOLD > 0 && Math.abs(event.values[0] - last_values[0]) < THRESHOLD
                && Math.abs(event.values[1] - last_values[1]) < THRESHOLD
                && Math.abs(event.values[2] - last_values[2]) < THRESHOLD) {
            return;
        }

        // Store current value temporarily so we are able to calculate next
        // iteration's delta.
        last_values = new Float[]{event.values[0], event.values[1], event.values[2]};

        // Add current record to queue in order to reduce to average.
        _avgQueue.add(event.values);
        _worstAccuracy = event.accuracy < _worstAccuracy ? event.accuracy : _worstAccuracy;

        // If current record has been sent too fast by android and is below the
        // required frequency, wait till next iteration.
        float[] mean;
        if (nowTimestamp < lastTimestamp + FREQUENCY / 1000) {
            return;
        }
        // Otherwise, reduce queue w/ average filter.
        else {
            // Retrieve number of item in queue in order to calculate average
            long count = _avgQueue.size();

            // Calculate total.
            float[] acc = new float[]{0.f, 0.f, 0.f};
            float[] curr = (float[]) _avgQueue.poll();
            do {
                acc[0] += curr[0];
                acc[1] += curr[1];
                acc[2] += curr[2];
                curr = (float[]) _avgQueue.poll();
            } while (curr != null);

            // Calculate mean.
            mean = new float[]{
                acc[0] / count,
                acc[1] / count,
                acc[2] / count
            };
        }

        // Proceed with saving as usual.
        ContentValues rowData = new ContentValues();
        rowData.put(Gyroscope_Data.DEVICE_ID, Aware.getSetting(getApplicationContext(), Aware_Preferences.DEVICE_ID));
        rowData.put(Gyroscope_Data.TIMESTAMP, nowTimestamp);
        rowData.put(Gyroscope_Data.VALUES_0, mean[0]);
        rowData.put(Gyroscope_Data.VALUES_1, mean[1]);
        rowData.put(Gyroscope_Data.VALUES_2, mean[2]);
        rowData.put(Gyroscope_Data.ACCURACY, _worstAccuracy);
        rowData.put(Gyroscope_Data.LABEL, LABEL);

        if (awareSensor != null) awareSensor.onGyroscopeChanged(rowData);

        data_values.add(rowData);
        lastTimestamp = nowTimestamp;

        // Reset queue.
        _avgQueue.clear();
        _worstAccuracy = Integer.MAX_VALUE;

        if (data_values.size() < 250 && nowTimestamp < LAST_SAVE + 300000) {
            return;
        }

        final ContentValues[] data_buffer = new ContentValues[data_values.size()];
        data_values.toArray(data_buffer);
        try {
            if (!Aware.getSetting(getApplicationContext(), Aware_Preferences.DEBUG_DB_SLOW).equals("true")) {
                new Thread(new Runnable() {
                    @Override
                    public void run() {
                        getContentResolver().bulkInsert(Gyroscope_Provider.Gyroscope_Data.CONTENT_URI, data_buffer);

                        Intent newData = new Intent(ACTION_AWARE_GYROSCOPE);
                        sendBroadcast(newData);
                    }
                }).run();
            }
        } catch (SQLiteException e) {
            if (Aware.DEBUG) Log.d(TAG, e.getMessage());
        } catch (SQLException e) {
            if (Aware.DEBUG) Log.d(TAG, e.getMessage());
        }
        data_values.clear();
        LAST_SAVE = nowTimestamp;
    }

    private static Gyroscope.AWARESensorObserver awareSensor;

    public static void setSensorObserver(Gyroscope.AWARESensorObserver observer) {
        awareSensor = observer;
    }

    public static Gyroscope.AWARESensorObserver getSensorObserver() {
        return awareSensor;
    }

    public interface AWARESensorObserver {
        void onGyroscopeChanged(ContentValues data);
    }

    /**
     * Calculates the sampling rate in Hz (i.e., how many samples did we collect in the past second)
     *
     * @param context
     * @return hz
     */
    public static int getFrequency(Context context) {
        int hz = 0;
        String[] columns = new String[]{"count(*) as frequency", "datetime(" + Gyroscope_Data.TIMESTAMP + "/1000, 'unixepoch','localtime') as sample_time"};
        Cursor qry = context.getContentResolver().query(Gyroscope_Data.CONTENT_URI, columns, "1) group by (sample_time", null, "sample_time DESC LIMIT 1 OFFSET 2");
        if (qry != null && qry.moveToFirst()) {
            hz = qry.getInt(0);
        }
        if (qry != null && !qry.isClosed()) qry.close();
        return hz;
    }

    private void saveGyroscopeDevice(Sensor gyro) {
        Cursor gyroInfo = getContentResolver().query(Gyroscope_Sensor.CONTENT_URI, null, null, null, null);
        if (gyroInfo == null || !gyroInfo.moveToFirst()) {
            ContentValues rowData = new ContentValues();
            rowData.put(Gyroscope_Sensor.DEVICE_ID, Aware.getSetting(getApplicationContext(), Aware_Preferences.DEVICE_ID));
            rowData.put(Gyroscope_Sensor.TIMESTAMP, System.currentTimeMillis());
            rowData.put(Gyroscope_Sensor.MAXIMUM_RANGE, gyro.getMaximumRange());
            rowData.put(Gyroscope_Sensor.MINIMUM_DELAY, gyro.getMinDelay());
            rowData.put(Gyroscope_Sensor.NAME, gyro.getName());
            rowData.put(Gyroscope_Sensor.POWER_MA, gyro.getPower());
            rowData.put(Gyroscope_Sensor.RESOLUTION, gyro.getResolution());
            rowData.put(Gyroscope_Sensor.TYPE, gyro.getType());
            rowData.put(Gyroscope_Sensor.VENDOR, gyro.getVendor());
            rowData.put(Gyroscope_Sensor.VERSION, gyro.getVersion());

            getContentResolver().insert(Gyroscope_Sensor.CONTENT_URI, rowData);

            Intent gyro_dev = new Intent(ACTION_AWARE_GYROSCOPE);
            gyro_dev.putExtra(EXTRA_SENSOR, rowData);
            sendBroadcast(gyro_dev);

            if (Aware.DEBUG) Log.d(TAG, "Gyroscope info: " + rowData.toString());
        }
        if (gyroInfo != null && !gyroInfo.isClosed()) gyroInfo.close();
    }

    @Override
    protected String getAuthority() {
        // This allows plugin data to be synced on demand from broadcast. Aware#ACTION_AWARE_SYNC_DATA
        return Gyroscope_Provider.getAuthority(this);
    }

    @Override
    public void onCreate() {
        super.onCreate();

        mSensorManager = (SensorManager) getSystemService(SENSOR_SERVICE);

        mGyroscope = mSensorManager.getDefaultSensor(Sensor.TYPE_GYROSCOPE);

        sensorThread = new HandlerThread(TAG);
        sensorThread.start();


        PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, TAG);
        wakeLock.acquire();

        sensorHandler = new Handler(sensorThread.getLooper());

        IntentFilter filter = new IntentFilter();
        filter.addAction(ACTION_AWARE_GYROSCOPE_LABEL);
        registerReceiver(dataLabeler, filter);

        if (Aware.DEBUG) Log.d(TAG, "Gyroscope service created!");
    }

    @Override
    public void onDestroy() {
        super.onDestroy();

        sensorHandler.removeCallbacksAndMessages(null);
        mSensorManager.unregisterListener(this, mGyroscope);
        sensorThread.quit();

        wakeLock.release();

        unregisterReceiver(dataLabeler);

        ContentResolver.setSyncAutomatically(Aware.getAWAREAccount(this), Gyroscope_Provider.getAuthority(this), false);
        ContentResolver.removePeriodicSync(
                Aware.getAWAREAccount(this),
                Gyroscope_Provider.getAuthority(this),
                Bundle.EMPTY
        );

        if (Aware.DEBUG) Log.d(TAG, "Gyroscope service terminated...");
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        super.onStartCommand(intent, flags, startId);

        if (PERMISSIONS_OK) {
            if (mGyroscope == null) {
                if (Aware.DEBUG) Log.w(TAG, "This device does not have a gyroscope!");
                Aware.setSetting(this, Aware_Preferences.STATUS_GYROSCOPE, false);
                stopSelf();
            } else {

                DEBUG = Aware.getSetting(this, Aware_Preferences.DEBUG_FLAG).equals("true");

                Aware.setSetting(this, Aware_Preferences.STATUS_GYROSCOPE, true);
                saveGyroscopeDevice(mGyroscope);

                if (Aware.getSetting(this, Aware_Preferences.FREQUENCY_GYROSCOPE).length() == 0) {
                    Aware.setSetting(this, Aware_Preferences.FREQUENCY_GYROSCOPE, 200000);
                }

                if (Aware.getSetting(this, Aware_Preferences.THRESHOLD_GYROSCOPE).length() == 0) {
                    Aware.setSetting(this, Aware_Preferences.THRESHOLD_GYROSCOPE, 0.0);
                }

                // @warning wondering if possible race condition due to
                //     asynchronous nature of service <-> activity communication
                //     through android sharedPreferences although everything is
                //     done in the same thread with current setting.

                // @warning potential race frequency due to service <->  + bug
                int new_frequency = Integer.parseInt(Aware.getSetting(getApplicationContext(), Aware_Preferences.FREQUENCY_GYROSCOPE));
                double new_threshold = Double.parseDouble(Aware.getSetting(getApplicationContext(), Aware_Preferences.THRESHOLD_GYROSCOPE));
                boolean new_enforce_frequency = (Aware.getSetting(getApplicationContext(), Aware_Preferences.FREQUENCY_GYROSCOPE_ENFORCE).equals("true")
                        || Aware.getSetting(getApplicationContext(), Aware_Preferences.ENFORCE_FREQUENCY_ALL).equals("true"));

                if (FREQUENCY != new_frequency
                        || THRESHOLD != new_threshold
                        || ENFORCE_FREQUENCY != new_enforce_frequency) {

                    sensorHandler.removeCallbacksAndMessages(null);
                    mSensorManager.unregisterListener(this, mGyroscope);

                    FREQUENCY = new_frequency;
                    THRESHOLD = new_threshold;
                    ENFORCE_FREQUENCY = new_enforce_frequency;
                }

                mSensorManager.registerListener(this, mGyroscope, Integer.parseInt(Aware.getSetting(getApplicationContext(), Aware_Preferences.FREQUENCY_GYROSCOPE)), sensorHandler);
                LAST_SAVE = System.currentTimeMillis();
            }

            if (Aware.DEBUG) Log.d(TAG, "Gyroscope service active: " + FREQUENCY + "ms");

            if (Aware.isStudy(this)) {
                ContentResolver.setIsSyncable(Aware.getAWAREAccount(this), Gyroscope_Provider.getAuthority(this), 1);
                ContentResolver.setSyncAutomatically(Aware.getAWAREAccount(this), Gyroscope_Provider.getAuthority(this), true);
                long frequency = Long.parseLong(Aware.getSetting(this, Aware_Preferences.FREQUENCY_WEBSERVICE)) * 60;
                SyncRequest request = new SyncRequest.Builder()
                        .syncPeriodic(frequency, frequency / 3)
                        .setSyncAdapter(Aware.getAWAREAccount(this), Gyroscope_Provider.getAuthority(this))
                        .setExtras(new Bundle()).build();
                ContentResolver.requestSync(request);
            }
        }

        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}