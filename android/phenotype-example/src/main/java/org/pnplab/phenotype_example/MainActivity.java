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
            Log.i("pheno", "bound");
            boolean isRunning = phenotype.isRunning();

            if (isRunning) {
                Log.i("pheno", "service already running.");
            }
            else {
                Log.i("pheno", "start");
                phenotype.start(() -> {
                    // Log.i("pheno", "stop");
                    // phenotype.stop();
                });
            }
        }, error -> {
            Log.e("pheno", error.getMessage());
            // throw error;
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
