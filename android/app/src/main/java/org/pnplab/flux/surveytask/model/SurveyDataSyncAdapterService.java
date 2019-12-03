package org.pnplab.flux.surveytask.model;


import android.app.Service;
import android.content.Intent;
import android.net.Uri;
import android.os.IBinder;
import androidx.annotation.Nullable;

import com.aware.syncadapters.AwareSyncAdapter;

// @note we rely on Aware Sync Adapter mechanism and use the plugin entrypoint
// of their backend to store these data even though we do not use their plugins.
public class SurveyDataSyncAdapterService extends Service {
    private AwareSyncAdapter sSyncAdapter = null;
    private static final Object sSyncAdapterLock = new Object();

    @Override
    public void onCreate() {
        super.onCreate();

        // @note I don't understand that lock as onCreate should only be
        // called once. However, it was on aware code and is on official
        // android guide as well. So I keep it for safety.
        synchronized (sSyncAdapterLock) {
            if (sSyncAdapter == null) {
                sSyncAdapter = new AwareSyncAdapter(getApplicationContext(), true, true);
                sSyncAdapter.init(
                    SurveyDataProvider.DATABASE_TABLES,
                    SurveyDataProvider.TABLES_FIELDS,
                    new Uri[]{
                        SurveyDataProvider.Survey_Data.CONTENT_URI
                    }
                );
            }
        }
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return sSyncAdapter.getSyncAdapterBinder();
    }
}
