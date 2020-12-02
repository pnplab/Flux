package org.pnplab.phenotype_example;

import androidx.appcompat.app.AppCompatActivity;

import android.os.Bundle;
import android.util.Log;

import static org.pnplab.phenotype.Phenotype.Phenotype;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // @todo ping service and log and see when it is run without battery +
        // correlates with significant motion

        Phenotype(phenotype -> {
            // display start button if !isRunning
            // run on click.
            Log.i("pheno", "phenotype: service interface retrieved.");
            boolean isRunning = phenotype.isBackgroundModeStarted() || phenotype.isBackgroundModeStarting();

            if (isRunning) {
                Log.i("pheno", "phenotype: service is already running.");
            }
            else {
                Log.i("pheno", "phenotype: service is starting.");
                phenotype.startBackgroundMode(
                    () -> {
                        Log.i("pheno", "phenotype: service has started.");
                        // phenotype.stop();
                    },
                    error -> {
                        Log.i("pheno", "phenotype: failed to start the service.");
                        Log.e("pheno", error.getMessage());
                    }
                );
            }
        }, error -> {
            Log.i("pheno", "phenotype: failed to retrieve the service interface and status.");
            Log.e("pheno", error.getMessage());
        });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
    }

    @Override
    protected void onPause() {
        super.onPause();
    }
}
