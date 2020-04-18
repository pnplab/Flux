package org.pnplab.stressoncovid19;

import androidx.appcompat.app.AppCompatActivity;

import android.os.Bundle;
import android.util.Log;

import static org.pnplab.phenotype.Phenotype.Phenotype;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // pedometer doc: https://developer.android.com/guide/topics/sensors/sensors_motion#sensors-motion-stepcounter

        Phenotype(phenotype -> {
            Log.i("psscov", "phenotype: service interface retrieved.");

            // Need to pass user information.
            // mutliple ways.
            //
            // ? set user id directly.
            //
            // ? set up user id through local inheritance -- Q? how to interact between inherited service and main app.
            //   -> messaging -- cf. decoupled abstraction layer
            //   -> inherited class + PROXY method call serialization (automatic messaging).
            //   -> inherited AIDL (remoter inheritance). BEST!
            //      q? how to merge AIDL interface with service inherited one ?
            //      -- must be 2 differents due to proxy/stub generation
            //      decorator
            //   -> sent serialized (aidl) objects.
            //
            // ? set up user id through service inheritance
            //   -> multiple backend config available from within the service
            //
            // X set up user id through backend configuration abstraction.
            //
            // X set up user id through service start (responsibility to recall is from app).
            //
            // constraints.
            //   need to be registered within the service for relaunch time.
            //
            // === LIFECYCLE SETUP!! -- should be within inherited aidl.
            // still need to communicate between UI and these.
            //
            // Should be considered as a client-server setup.

            // THIS IS NOT THE PLACE TO SET UP THE SERVICE DATAFLOW.
            //
            // ! Dataflow must stay independant from within the service by
            // design (due to restart) !
            //
            // Remoter aidl interface and parcelable can only be generated from
            // the service side (framework can't depend on app code).
            //
            // need to change backend config
            // need to have backend config at launch
            // need to stay flexible for any user.

            // CQRS = mixed lifecycle

            boolean isRunning = phenotype.isBackgroundModeStarting() || phenotype.isBackgroundModeStarted();
            if (isRunning) {
                Log.i("psscov", "phenotype: service is already running.");
            }
            else {
                Log.i("psscov", "phenotype: service is starting.");
                phenotype.startBackgroundMode(() -> {
                    // phenotype.sendCommand(new Pedometer.Start);
                    Log.i("psscov", "phenotype: service has started.");


                    Log.i("psscov", "phenotype: recording pedometer.");
                    // phenotype.getPedometer().startRecord();
                    // phenotype.startPedometerRecording();
                    // phenotype.stop();
                }, error -> {
                    Log.i("psscov", "phenotype: failed to start the service.");
                    Log.e("psscov", error.getMessage());
                });
            }
        }, error -> {
            Log.i("psscov", "phenotype: failed to retrieve the service interface and status.");
            Log.e("psscov", error.getMessage());
        });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
    }

}
