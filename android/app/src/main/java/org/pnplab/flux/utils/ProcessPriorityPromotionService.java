package org.pnplab.flux.utils;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;

import androidx.annotation.Nullable;

public class ProcessPriorityPromotionService extends Service {
    // This service is just there to promote the current process to background process in order
    // to prevent android from killing the process when activity is closed, and keep threads
    // such as MuseDeviceExecutionThread running while the app is in background.
    //
    // To start it:
    // context.startService(new Intent(this, ProcessPriorityPromotionService.class));
    //
    // To stop it:
    // context.stopService(new Intent(this, ProcessPriorityPromotionService.class));
    //
    // No need to take care about handling memory ownership passation as GC wont happen since
    // the true lifecycle granularity to watch for in regards to GC is starting from the thread
    // unit. In other word, the JVM always holds a reference to any threads, and
    // MuseDeviceExecutionThread holds references to what it needs by definition anyway.
    //
    // It may seems weird to use android API this way. However, this avoid us to have to wait for
    // OS to create the service for us (which according to the doc is completely indeterministic...
    // It's probably nearly as fast but well, it's not specified..) and instead rely directly on
    // thread mechanism which is obviously run through system call as well but we know it's nearly
    // always close to instantaneity.

    // Return the mandatory Binder reference.
    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    // Do not restart the service if the process is being killed by android. It wouldn't make sense
    // as the restarted service wont trigger any code anyway.
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_NOT_STICKY;
    }
}
