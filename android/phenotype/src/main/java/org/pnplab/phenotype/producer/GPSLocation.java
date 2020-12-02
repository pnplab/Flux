package org.pnplab.phenotype.generators;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Criteria;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;

import androidx.core.content.ContextCompat;

import io.reactivex.rxjava3.core.BackpressureStrategy;
import io.reactivex.rxjava3.core.Flowable;

public class GPSLocation {

    /*
    public static void requestPermissions() {
        boolean permissionAccessCoarseLocationApproved =
        ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION)
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
    */

    // @warning observer thread req. Looper.
    public static class GPSTimePoint {
        public final long timestamp; // ns since boot.
        // public final double timestampUncertainty; // ns. @warning should drop. @note req. android 10.

        public final float accuracy;
        public final double latitude;
        public final double longitude;
        public final double altitude;
        // public final float verticalAccuracy; // @note req. android 10.
        public final float bearing; // direction angle
        // public final float bearingAccuracy; // direction angle // @note req. android 10.
        public final float speed;
        // final float speedAccuracy; // @note req. android 10.

        public GPSTimePoint(
                long timestamp,
                // double timestampUncertainty,
                float accuracy,
                double latitude,
                double longitude,
                double altitude,
                // float verticalAccuracy,
                float bearing,
                // float bearingAccuracy,
                float speed
                // float speedAccuracy
        ) {
            this.timestamp = timestamp;
            // this.timestampUncertainty = timestampUncertainty;
            this.accuracy = accuracy;
            this.latitude = latitude;
            this.longitude = longitude;
            this.altitude = altitude;
            // this.verticalAccuracy = verticalAccuracy;
            this.bearing = bearing;
            // this.bearingAccuracy = bearingAccuracy;
            this.speed = speed;
            // this.speedAccuracy = speedAccuracy;
        }
    }

    //
    public static Flowable<GPSTimePoint> stream(Context context) {
        // - permission request stream
        // - location stream
        // - location status stream

        // 1. using a common stream involve redundant filtering.
        // 1.1. using a single observable with filtering ensure sequential order.
        // 2. using multiple (hot) streams (w/ defer to cold them?).
        // 2.1. multiple streams might be subscribed from different thread.
        // 2.2. this might provide different asynchronicity
        // Q? how to guarantee synchronous order with multiple stream that
        //    could later be merged ?
        //    -> hot observable with same thread. -- subscription might still
        //    happen to different thread though.



        // -> hot observables subjects

        // -> multiple cold observables (dual req.).

        // @todo cache
        return Flowable.create(emitter -> {
            LocationManager locationManager = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
            assert locationManager != null;

            // @warning
            // There is no direct feedback whether user has revoked permissions
            // manually or not.
            //
            // If user revokes permission manually, process should be terminated (
            // and restarted automatically in our case due to sticky service, thus
            // likely calling checkSelfPermission again)
            // cf. https://stackoverflow.com/a/32719122/939741
            //
            // @warning
            // I don't know how to interpret this:
            // "If your targetSdkVersion is below 23, checkSelfPermission() will not
            // help, but you should be getting bogus data rather than a
            // SecurityException".
            // cf. https://stackoverflow.com/a/32719122/939741
            if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                if (!emitter.isCancelled()) {
                    emitter.onError(new IllegalAccessException("ACCESS_FINE_LOCATION permission is not granted"));
                }
                return;
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_BACKGROUND_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                    if (!emitter.isCancelled()) {
                        emitter.onError(new IllegalAccessException("ACCESS_BACKGROUND_LOCATION permission is not granted"));
                    }
                    return;
                }
            }
            // Retrieve a list of location providers that have fine accuracy, no monetary cost, etc
            Criteria criteria = new Criteria();
            criteria.setAccuracy(Criteria.ACCURACY_FINE);
            criteria.setCostAllowed(false);

            // Forward listener callback to emitter.
            LocationListener locationListener = new LocationListener() {
                @Override
                public void onLocationChanged(Location location) {
                    if (!emitter.isCancelled()) {
                        // Generate data object.
                        GPSTimePoint gpsTimePoint = new GPSTimePoint(
                                location.getElapsedRealtimeNanos(),
                                // location.getElapsedRealtimeUncertaintyNanos(),
                                location.getAccuracy(),
                                location.getLatitude(),
                                location.getLongitude(),
                                location.getAltitude(),
                                // location.getVerticalAccuracyMeters(),
                                location.getBearing(),
                                // location.getBearingAccuracyDegrees(),
                                location.getSpeed()
                                // location.getSpeedAccuracyMetersPerSecond()
                        );
                        emitter.onNext(gpsTimePoint);
                    }
                }

                @Override
                public void onStatusChanged(String provider, int status, Bundle extras) {
                    // ...this never get called according to doc.
                }

                @Override
                public void onProviderEnabled(String provider) {
                    // @todo check this - triggered on user action acc. to doc ?
                }

                @Override
                public void onProviderDisabled(String provider) {
                    // @todo check this - triggered on user action acc. to doc ?
                }
            };

            // Request location listener.
            locationManager.requestLocationUpdates(
                1000, // 1s
                0.1f, // 10cm
                 criteria,
                 locationListener,
                null // @warning requires current executing thread to have looper.
            );

        }, BackpressureStrategy.BUFFER);
    }
}
