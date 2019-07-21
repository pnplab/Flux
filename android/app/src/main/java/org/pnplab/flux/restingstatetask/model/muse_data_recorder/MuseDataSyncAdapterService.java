package org.pnplab.flux.restingstatetask.model.muse_data_recorder;

import android.app.Service;
import android.content.Intent;
import android.net.Uri;
import android.os.IBinder;

import androidx.annotation.Nullable;

import com.aware.syncadapters.AwareSyncAdapter;

// @note We rely on Aware Sync Adapter mechanism and use the plugin entrypoint of their backend to
// store these data even though we do not use their plugins.
public final class MuseDataSyncAdapterService extends Service {

    private AwareSyncAdapter sSyncAdapter = null;
    private static final Object sSyncAdapterLock = new Object();

    @Override
    public void onCreate() {
        super.onCreate();

        // @note That lock makes no sense to me as onCreate should only be called once. However, it
        // was on aware code and is on official android guide as well. So I  keep it for safety.
        synchronized (sSyncAdapterLock) {
            if (sSyncAdapter == null) {
                sSyncAdapter = new AwareSyncAdapter(getApplicationContext(), true, true);
                sSyncAdapter.init(
                    MuseDataProvider.DATABASE_TABLES, MuseDataProvider.TABLES_FIELDS,
                    new Uri[]{
                        MuseDataProvider.MuseEegData.CONTENT_URI
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
