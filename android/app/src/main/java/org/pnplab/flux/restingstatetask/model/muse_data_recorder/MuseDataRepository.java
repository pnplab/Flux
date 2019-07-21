package org.pnplab.flux.restingstatetask.model.muse_data_recorder;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.database.SQLException;
import android.util.Log;

public class MuseDataRepository {

    private final ContentResolver _contentResolver;
    private final String TAG = "Flux";

    public MuseDataRepository(ContentResolver contentResolver) {
        _contentResolver = contentResolver;
    }

    public void insertDataPoint(String awareDeviceId, long museTimestamp, long phoneTimestamp,
                                double eegChannel1, double eegChannel2, double eegChannel3, double eegChannel4)
    {
        // Generate values for provider.
        // @WARNING @TODO @FIXME 64 bit timestamps are stored into 32bits real...
        ContentValues context_data = new ContentValues();
        context_data.put(MuseDataProvider.MuseEegData.TIMESTAMP, museTimestamp);
        context_data.put(MuseDataProvider.MuseEegData.PHONE_TIMESTAMP, phoneTimestamp);
        context_data.put(MuseDataProvider.MuseEegData.DEVICE_ID, awareDeviceId);
        context_data.put(MuseDataProvider.MuseEegData.EEG1, eegChannel1);
        context_data.put(MuseDataProvider.MuseEegData.EEG2, eegChannel2);
        context_data.put(MuseDataProvider.MuseEegData.EEG3, eegChannel3);
        context_data.put(MuseDataProvider.MuseEegData.EEG4, eegChannel4);

        // Insert data in db (as we're dealing with high frequency timeseries data, this slow
        // operation is the reason behind the circular buffer we use inside MuseDataCircularBuffer).
        try {
            _contentResolver.insert(MuseDataProvider.MuseEegData.CONTENT_URI, context_data);
        } catch (SQLException e) {
            Log.e(TAG, "Failed to record Muse timeseries data to SQL !");
        }
    }

}
