package org.pnplab.phenotype.system.entrypoints;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.Context;
import android.content.pm.ProviderInfo;
import android.database.Cursor;
import android.net.Uri;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import org.pnplab.phenotype.BuildConfig;
import org.pnplab.phenotype.Phenotype;
import org.pnplab.phenotype.logger.AbstractLogger;
import org.pnplab.phenotype.logger.DefaultLogger;

/**
 * Define a content provider used to automatically share the android Context
 * across the client part of our lib without requiring the lib's user to do it.
 *
 * This ContentProvider is enabled in the lib's user's process. Thus it can
 * only used to share the Context across the app's main process. For the lib's
 * external process, we should rely on the service's context or whatever other
 * entrypoint's context.
 *
 * This usage is not originally intended for ContentProvider but still used by
 * google.
 * cf. https://firebase.googleblog.com/2016/12/how-does-firebase-initialize-on-android.html
 *
 * Also word reading: synchronous service binding is hackily possible using a
 * content provider although we're not sure it wont crash if the service is not
 * already running, even though the article seems to states it should work.
 * This would allow using our api straight, without the phenotype connection
 * method. To be tested. Also, could be laggy on UI thread.
 * cf. http://mdev-android.blogspot.com/2014/12/androids-alternative-ipc-approche.html
 */
public class PhenotypeClientInitProvider extends ContentProvider {

    // Store the android context statically so we can share it to other
    // android's component.
    static private Context _context = null;
    private final AbstractLogger _log = new DefaultLogger();// AbstractPhenotypeInitProvider.getLogger();

    // Provide the android context object to the rest of our lib.
    static public Context getApplicationContext() {
        // Check the context is existing. This should always be the case as
        // content provider are initialised by android even before Application.
        // Our lib being accessed from an activity, this should thus be already
        // initialised, but for safety, we double check it.
        if (_context == null) {
            throw new IllegalStateException("PhenotypeClientInitProvider's context is " +
                    "null. PhenotypeClientInitProvider#getApplicationContext should be " +
                    "used after ContentProviders initialisation.");
        }

        // Return the context.
        return _context;
    }

    // Retrieve and set application context globally.
    @Override
    public boolean onCreate() {
        // Set the context.
        _context = getContext().getApplicationContext();

        // Initialize logger.
        _log.initialize(_context);

        // Trace this callback.
        _log.t();

        // Propagate the context to our lib client's dependency.
        Phenotype.initialize(_context);

        return false;
    }

    // Authority must be unique to content provider. Ensure applicationId has
    // been set in gradle by the lib user so in case multiple apps use this lib
    // on the same device, no conflict occurs.
    @Override
    public void attachInfo(Context context, ProviderInfo info) {
        _log.t();

        // Check ProviderInfo is not null.
        if (info == null) {
            throw new IllegalStateException("PhenotypeClientInitProvider#attachInfo's ProviderInfo should be provided");
        }

        // Ensure applicationId has been configured in gradle by the lib user.
        // cf. https://stackoverflow.com/a/55429286/939741
        if (info.authority.startsWith("org.pnplab.phenotype.")) {
            throw new IllegalStateException("applicationId should be set in your gradle file. cf. https://stackoverflow.com/a/55429286/939741.");
        }

        // Forward call to parent method.
        super.attachInfo(context, info);
    }

    // ...other methods are not used as we strictly use this content provider
    // to share the context object to our lib.

    @Nullable
    @Override
    public Cursor query(@NonNull Uri uri, @Nullable String[] strings, @Nullable String s, @Nullable String[] strings1, @Nullable String s1) {
        return null;
    }

    @Nullable
    @Override
    public String getType(@NonNull Uri uri) {
        return null;
    }

    @Nullable
    @Override
    public Uri insert(@NonNull Uri uri, @Nullable ContentValues contentValues) {
        return null;
    }

    @Override
    public int delete(@NonNull Uri uri, @Nullable String s, @Nullable String[] strings) {
        return 0;
    }

    @Override
    public int update(@NonNull Uri uri, @Nullable ContentValues contentValues, @Nullable String s, @Nullable String[] strings) {
        return 0;
    }
}
