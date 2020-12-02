package org.pnplab.flux.utils;

import android.app.Activity;
import android.app.Application;
import android.app.Application.ActivityLifecycleCallbacks;
import android.os.Bundle;
import android.util.Log;
import android.util.SparseArray;

import androidx.annotation.NonNull;

import java.lang.ref.WeakReference;

// @todo implement permission rationale.
// @todo implement request retrigger in case activity changes (can happen on device rotation).
public class PermissionManager implements IPermissionManager, AutoCloseable {
    // Reference to application held in order to close PermissionManager listeners bound to
    // application.
    private final Application application;

    // Keep current activity in order to clean it's listener related to PermissionManager later.
    // No memory leak considering this object lifecycle is supposed to be tied to application
    // lifecycle (thus created in application and destroyed in application) - which encompasses
    // activity lifecycle - and its lifecycle is correctly handled. Added a WeakReference for
    // safety.
    private WeakReference<IPermissionManagerForwarder> currentActivity = null;

    // Setup listeners
    public PermissionManager(Application application) {
        this.application = application;

        // As the only way to retrieve the result of a permission request dialog is to receive an
        // asynchronous callback from current activity instance, we keep track of what's the
        // current activity. Beware that android may kill and recreate an activity when the device
        // rotate.
        application.registerActivityLifecycleCallbacks(activityLifecycleCallbacks);
    }

    // Cleanup listeners. It's not mandatory as PermissionManager lifecycle should be tied to
    // application lifecycle thus making this unrelevant, but well..
    @Override
    public void close() {
        // Cleanup listeners.
        application.unregisterActivityLifecycleCallbacks(activityLifecycleCallbacks);

        // Same goes for Activity lifecycle which is wrapped by Application lifecycle by design.
        if (currentActivity != null) {
            currentActivity.get().stopListenerForwarding(this);
            currentActivity = null;
        }
    }

    // Android let you retrieve wich permission request as been answered to an integer code you
    // define. We store the last used one here. Have seen in some code a limitation of 8 bit for
    // this code, but this seems not to be documented so might be actually limited to MAX_INT
    // instead.
    private int currentRequestCode = 0;
    private final int maxRequestCode = 255;
    private SparseArray<FunctionIn1<PermissionResult>> permissionCallbacks = new SparseArray<>();

    // Check if permission is granted or not.
    public boolean isPermissionGranted(@NonNull String permission) {
        int grantResultInt = currentActivity.get().checkSelfPermission(permission);
        PermissionResult grantResult = PermissionResult.fromValue(grantResultInt);

        return grantResult == PermissionResult.PERMISSION_GRANTED;
    }

    // Request new permission and provide an optional callback for it.
    public void requestPermission(@NonNull String permission, FunctionIn1<PermissionResult> onResult) {
        // WritableStore callback until permission result is received.
        if (onResult != null) {
            // Check there is a slot left for the callback. This should always be the case except
            // through severe volontary stress test of the current method, but for safety...
            if (permissionCallbacks.get(currentRequestCode, null) != null) {
                throw new IndexOutOfBoundsException("There is more than 256 request dialog response awaiting");
            }

            // WritableStore the method.
            permissionCallbacks.put(currentRequestCode, onResult);
        }

        // Trigger permission request.
        currentActivity.get().requestPermissions(new String[]{permission}, currentRequestCode);

        // Increase the current request code.
        if (currentRequestCode == maxRequestCode) {
            currentRequestCode = 0;
        }
        else {
            currentRequestCode += 1;
        }
    }

    // Callback forwarded from activity on permission dialog request result.
    public void forwardRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        // Check a callback has been provided for the permission request and trigger it.
        if (permissionCallbacks.get(requestCode, null) != null) {
            // Only one permission per request allowed in current PermissionManager implementation.
            assert permissions.length == 1;
            assert grantResults.length == 1;

            // Retrieve the callback.
            FunctionIn1<PermissionResult> callback = permissionCallbacks.get(requestCode);

            // Current impl shouldn't store null callback.
            assert callback != null;

            // Format the permission request result in enum.
            PermissionResult grantResult = PermissionResult.fromValue(grantResults[0]);

            // Trigger the callback.
            callback.apply(grantResult);

            // Remove the callback once called.
            permissionCallbacks.remove(requestCode);
        }
    }

    // A listener tracking what is the current activity in order for it to have the
    // PermissionManager injected so it can forward the onRequestPermissionResult back to the
    // PermissionManager's instance.
    private class PermissionManagerActivityListener implements ActivityLifecycleCallbacks {
        private final PermissionManager pm;

        PermissionManagerActivityListener(PermissionManager pm) {
            this.pm = pm;
        }

        @Override
        public void onActivityCreated(Activity activity, Bundle bundle) {
            // Called whenever the OS want, but likely on display.
        }

        @Override
        public void onActivityStarted(Activity activity) {
            assert currentActivity == null;

            if (activity instanceof IPermissionManagerForwarder) {
                currentActivity = new WeakReference<>((IPermissionManagerForwarder) activity);
                currentActivity.get().startListenerForwarding(pm);
            }
            else {
                // We just want to bypass implemetation activities that doesn't
                // implement PermissionManager instead of throwing. eg. it
                // throws with aware's PermissionsHandler.
                currentActivity = null;
                Log.e("Flux", "Current activity doesn't implement PermissionManagerForwarder");
            }
        }

        @Override
        public void onActivityResumed(Activity activity) {
            // Called when another activity closes on top of the current activity. This happens
            // when a permission request dialog is shown for instance. Thus it is generally not
            // advised to put permission logic in here.
        }

        @Override
        public void onActivityPaused(Activity activity) {
            // Called when another activity shows on top of the current activity.
        }

        @Override
        public void onActivityStopped(Activity activity) {
            // Called when current activity is completely hidden from user.

            if (activity != currentActivity.get()) {
                // Code should never get called with the current PermissionManager implementation
                // as all activities are expected to implement PermissionManagerForwarder. Added
                // for safety in case of implemetation change...
            }
            else {
                assert currentActivity != null;

                // Clear activity's references to PermissionManager.
                // not needed as activity will be destroyed before application which handles
                // PermissionManager lifecycle, and is likely to be ongoing, but well...
                currentActivity.get().stopListenerForwarding(pm);

                // Clear PermissionManager references to activity that is no longer used. Mandatory
                // to avoid memory leak!
                currentActivity = null;
            }
        }

        @Override
        public void onActivitySaveInstanceState(Activity activity, Bundle bundle) {

        }

        @Override
        public void onActivityDestroyed(Activity activity) {
            // Activity is destroyed whenever the OS want. Likely soon enough ;)
        }
    }
    private final ActivityLifecycleCallbacks activityLifecycleCallbacks = new PermissionManagerActivityListener(this);
}
