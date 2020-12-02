package org.pnplab.phenotype.producer;

// requires google play.
// cf. https://developer.android.com/training/location/retrieve-current
// cf. https://developer.android.com/training/location/change-location-settings
// cf. https://developer.android.com/training/location/request-updates
public class FusedLocation {
    /*
    public static void requestPermissions() {
        boolean permissionAccessCoarseLocationApproved =
        ActivityCompat.checkSelfPermission(this, permission.ACCESS_COARSE_LOCATION)
                == PackageManager.PERMISSION_GRANTED;

        if (permissionAccessCoarseLocationApproved) {
           boolean backgroundLocationPermissionApproved =
                   ActivityCompat.checkSelfPermission(this,
                       permission.ACCESS_BACKGROUND_LOCATION)
                       == PackageManager.PERMISSION_GRANTED;

           if (backgroundLocationPermissionApproved) {
               // App can access location both in the foreground and in the background.
               // Start your service that doesn't have a foreground service type
               // defined.
           } else {
               // App can only access location in the foreground. Display a dialog
               // warning the user that your app must have all-the-time access to
               // location in order to function properly. Then, request background
               // location.
               ActivityCompat.requestPermissions(this, new String[] {
                   Manifest.permission.ACCESS_BACKGROUND_LOCATION},
                   your-permission-request-code);
           }
        } else {
           // App doesn't have access to the device's location at all. Make full request
           // for permission.
           ActivityCompat.requestPermissions(this, new String[] {
                Manifest.permission.ACCESS_COARSE_LOCATION,
                Manifest.permission.ACCESS_BACKGROUND_LOCATION
                },
                your-permission-request-code);
        }
    }

    public static boolean hasAccess() {
        boolean permissionAccessCoarseLocationApproved =
            ActivityCompat.checkSelfPermission(this,
                permission.ACCESS_COARSE_LOCATION) ==
                PackageManager.PERMISSION_GRANTED;

        if (permissionAccessCoarseLocationApproved) {
            // App has permission to access location in the foreground. Start your
            // foreground service that has a foreground service type of "location".
        } else {
           // Make a request for foreground-only location access.
           ActivityCompat.requestPermissions(this, new String[] {
                Manifest.permission.ACCESS_COARSE_LOCATION},
               your-permission-request-code);
        }
        return permissionAccessCoarseLocationApproved;
    }

    private void _generateListener() {
        locationCallback = new LocationCallback() {
            @Override
            public void onLocationResult(LocationResult locationResult) {
                if (locationResult == null) {
                    return;
                }
                for (FusedLocation location : locationResult.getLocations()) {
                    // Update UI with location data
                    // ...
                }
            }
        };

    }
    public void start() {
        fusedLocationClient.requestLocationUpdates(locationRequest,
        locationCallback,
        Looper.getMainLooper());
    }
    public void stop() {
        fusedLocationClient.removeLocationUpdates(locationCallback);
    }
    */

}
