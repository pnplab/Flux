package org.pnplab.flux.utils;

import android.app.Application;
import android.content.Intent;

// This class allows running thread to keep running when app is in background. This should work
// both for main/ui thread as well as any other running threads. It's been made to avoid having to
// pass context object everywhere and thus making the application more easily testable.
public class ProcessPriorityPromoter implements IProcessPriorityPromoter {
    private final Application _application;
    private int _refCount = 0;

    public ProcessPriorityPromoter(Application application) {
        _application = application;
    }

    // Promote current process with background privilege.
    public synchronized void promoteProcessToBackgroundState() {
        // Start ProcessPriorityPromotionService if not already started.
        if (_refCount == 0) {
            _application.startService(new Intent(_application, ProcessPriorityPromotionService.class));
        }

        // Increase refcount.
        _refCount += 1;
    }

    // Unpromote current process from background privilege.
    public synchronized void unpromoteProcessFromBackgroundState() {
        // Decrease refcount.
        _refCount -= 1;

        // Stop ProcessPriorityPromotionService once no longer needed.
        if (_refCount == 0) {
            _application.stopService(new Intent(_application, ProcessPriorityPromotionService.class));
        }
    }
}
