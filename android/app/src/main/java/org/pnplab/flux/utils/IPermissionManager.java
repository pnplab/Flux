package org.pnplab.flux.utils;

import android.content.pm.PackageManager;

import androidx.annotation.NonNull;

import java.util.InputMismatchException;

public interface IPermissionManager {
    // Interface for activities to implement so they forward their onRequestPermissionsResult calls
    // to PermissionManager. Once implemented, the methods should simply call
    // concrete PermissionManager.PermissionManagerForwarder class' ones through composability.
    // Methods are not implemented directly here in order to enforce onRequestPermissionsResult to
    // be correctly implemented in the target Activity child class. Indeed, the child class also
    // inherits from base Activity class by design and thus the interface cannot implement safely
    // onRequestPermissionResult with default interface method mechanism as it's present in both
    // classes.
    interface IPermissionManagerForwarder {
        // These methods should call PermissionManagerForwarderHelper instance's methods.
        void startListenerForwarding(IPermissionManager pm);
        void stopListenerForwarding(IPermissionManager pm);

        // This method should call corresponding PermissionManagerForwarderHelper instance's method
        // as well as super class one.
        void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults);

        // These ones are already implemented through Activity class.
        void requestPermissions(String[] permissions, int requestCode);
        int checkSelfPermission(String permission);
    }

    // The activities should implement IPermissionManagerForwarder and use the following helper
    // class to forward their onRequestPermissionsResult calls to the PermissionManager through
    // composability. This helper only allow one PermissionManager per app. It's obviously possible
    // to bypass this helper and reimplement the forwarding mechanism in order to be able to
    // handle multiple PermissionManager, but there appear to be no real use case.
    class PermissionManagerForwarderHelper {
        private IPermissionManager pm = null;

        public void startListenerForwarding(IPermissionManager pm) {
            assert this.pm == null;
            this.pm = pm;
        }
        public void stopListenerForwarding(IPermissionManager pm) {
            assert this.pm != null;
            this.pm = null;
        }
        public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
            // Check permission manager has been set. This should always be the case except if the
            // user has badly implemented start/stop methods.
            if (pm == null) {
                throw new RuntimeException("Activity's PermissionManager instance is null. This probably implies the Activity's has badly reimplemented PermissionManagerForwarder interface default methods.");
            }

            // Forward callback to permission manager.
            pm.forwardRequestPermissionsResult(requestCode, permissions, grantResults);
        }
    }

    // Check whether permission has been attributed or not. Watchout, requestPermission method is
    // asynchrone so this should not be called after.
    boolean isPermissionGranted(@NonNull String permission);

    // Request a permission and optionally trigger a callback.
    void requestPermission(@NonNull String permission, FunctionIn1<PermissionResult> onResult);

    // This method should be called by activities when they receive request permission result
    // through PermissionManagerForwarderHelper.
    void forwardRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults);

    // Enumerate the possible result of permission request in order to allow the user of the
    // callback to know if the permission has been granted.
    enum PermissionResult {
        PERMISSION_GRANTED(PackageManager.PERMISSION_GRANTED),
        PERMISSION_DENIED(PackageManager.PERMISSION_DENIED);

        // Store it's package manager value for easy comparison in the
        // on/forwardRequestPermissionsResult method.
        public final int packageManagerVal;

        PermissionResult(int packageManagerVal) {
            this.packageManagerVal = packageManagerVal;
        }

        public static PermissionResult fromValue(int value) {
            switch (value) {
                case PackageManager.PERMISSION_GRANTED:
                    return PERMISSION_GRANTED;
                case PackageManager.PERMISSION_DENIED:
                    return PERMISSION_DENIED;
                default:
                    throw new InputMismatchException("PermissionResult created with impossible int value.");
            }
        }
    }
}
