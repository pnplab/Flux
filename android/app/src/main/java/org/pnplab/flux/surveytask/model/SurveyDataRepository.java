package org.pnplab.flux.surveytask.model;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.util.Log;

import net.sqlcipher.SQLException;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class SurveyDataRepository {

    private final ContentResolver _contentResolver;
    private final String TAG = "Flux";

    public SurveyDataRepository(ContentResolver contentResolver) {
        _contentResolver = contentResolver;
    }

    public void insertSurveyData(String deviceId, String formId, long timestamp, Map<String, Double> content) {
        Set<ContentValues> context_datas = new HashSet<ContentValues>(content.size());
        for (Map.Entry<String, Double> entry : content.entrySet()) {
            ContentValues context_data = new ContentValues();
            context_data.put(SurveyDataProvider.Survey_Data.TIMESTAMP, timestamp);
            context_data.put(SurveyDataProvider.Survey_Data.DEVICE_ID, deviceId);
            context_data.put(SurveyDataProvider.Survey_Data.FORM_ID, formId);
            context_data.put(SurveyDataProvider.Survey_Data.QUESTION_ID, entry.getKey());
            context_data.put(SurveyDataProvider.Survey_Data.VALUE, entry.getValue());
            context_datas.add(context_data);
        }

        try {
            _contentResolver.bulkInsert(
                SurveyDataProvider.Survey_Data.CONTENT_URI,
                context_datas.toArray(new ContentValues[context_datas.size()])
            );
        } catch (SQLException e) {
            Log.e(TAG, "Failed to record survey data to SQL !");
            Log.d(TAG, e.getMessage());
        }
    }

}
