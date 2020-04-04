package org.pnplab.phenotype_example;

import android.app.Application;
import android.content.Context;
import android.os.Environment;

import com.facebook.flipper.android.AndroidFlipperClient;
import com.facebook.flipper.android.utils.FlipperUtils;
import com.facebook.flipper.core.FlipperClient;
import com.facebook.flipper.plugins.databases.DatabasesFlipperPlugin;
import com.facebook.flipper.plugins.databases.impl.SqliteDatabaseDriver;
import com.facebook.flipper.plugins.inspector.DescriptorMapping;
import com.facebook.flipper.plugins.inspector.InspectorFlipperPlugin;
import com.facebook.flipper.plugins.network.NetworkFlipperPlugin;
import com.facebook.soloader.SoLoader;

import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();

        Context context = getApplicationContext();

        SoLoader.init(this, false);

        // Init Flipper API for desktop debugging app compatible w/ android and
        // iOS. It provides helper to manage db and leak canary.
        // @warning check device incompatibility when opening client app from
        // desktop computer https://fbflipper.com/docs/troubleshooting.html#connection-issues
        if (BuildConfig.DEBUG && FlipperUtils.shouldEnableFlipper(this)) {
            final FlipperClient client = AndroidFlipperClient.getInstance(this);
            client.addPlugin(new InspectorFlipperPlugin(this, DescriptorMapping.withDefaults()));
            // @note For some reason, Ping database is listed by default
            // (found from context according to doc) while Accelerometer
            // db is not. Both coexist in the same folder. We thus specify
            // the list manually. Would this be due to the fact databases are
            // used in a different context (the external phenotyping process
            // one) which are bound for a short while at the app launch ?
            // (would only explain partly the issue).
            client.addPlugin(new DatabasesFlipperPlugin(new SqliteDatabaseDriver(context, () -> {
                File dbFolder;
                if (Environment.getExternalStorageState().equals(Environment.MEDIA_MOUNTED) && context.getExternalFilesDir("sqlite") != null) {
                    dbFolder = context.getExternalFilesDir("sqlite");
                }
                else {
                    dbFolder = new File(context.getFilesDir(), "sqlite");
                }
                if (dbFolder != null && !dbFolder.exists()) {
                    dbFolder.mkdirs();
                }
                if (dbFolder == null){
                    throw new IllegalStateException("Couldn't create sqlite folder");
                }

                List<File> databaseFiles = null;
                File[] files = dbFolder.listFiles();
                if (files == null) {
                    databaseFiles = new ArrayList<File>();
                }
                else {
                    databaseFiles = new ArrayList<>(Arrays.asList(files));
                }

                return databaseFiles;
            })));

            NetworkFlipperPlugin networkFlipperPlugin = new NetworkFlipperPlugin();
            client.addPlugin(networkFlipperPlugin);
            client.start();
        }
    }

}
