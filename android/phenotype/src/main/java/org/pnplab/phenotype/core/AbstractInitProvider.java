package org.pnplab.phenotype.system.core;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.Context;
import android.content.pm.ProviderInfo;
import android.database.Cursor;
import android.net.Uri;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import org.pnplab.phenotype.Phenotype;
import org.pnplab.phenotype.logger.AbstractLogger;

abstract public class AbstractPhenotypeInitProvider extends ContentProvider {

    // WritableStore the android context statically so we can share it to other
    // android's component.
    static private Context _context = null;
    private AbstractLogger _log;

    // Provide the android context object to the rest of our lib.
    static public Context getApplicationContext() {
        // Check the context is existing. This should always be the case as
        // content provider are initialised by android even before Application.
        // Our lib being accessed from an activity, this should thus be already
        // initialised, but for safety, we double check it.
        if (_context == null) {
            throw new IllegalStateException(
                "PhenotypeClientInitProvider's context is null. " +
                "PhenotypeClientInitProvider#getApplicationContext should be " +
                "used after ContentProviders initialisation."
            );
        }

        // Return the context.
        return _context;
    }

    private static AbstractLogger _logger = null;
    protected static void setLogger(AbstractLogger logger) {
        _logger = logger;
    }
    public static AbstractLogger getLogger() {
        return new AbstractLogger() {
            @Override
            public void initialize(Context context) {
                AbstractPhenotypeInitProvider._logger.initialize(context);
            }

            @Override
            public void i(String msg) {
                AbstractPhenotypeInitProvider._logger.i(msg);
            }

            @Override
            public void e(String msg) {
                AbstractPhenotypeInitProvider._logger.e(msg);
            }

            @Override
            public void w(String msg) {
                AbstractPhenotypeInitProvider._logger.w(msg);
            }

            @Override
            public void d(String msg) {
                AbstractPhenotypeInitProvider._logger.d(msg);
            }

            @Override
            public void v(String msg) {
                AbstractPhenotypeInitProvider._logger.v(msg);
            }

            @Override
            public void wtf(String msg) {
                AbstractPhenotypeInitProvider._logger.wtf(msg);
            }

            @Override
            public void t() {
                AbstractPhenotypeInitProvider._logger.t();
            }
        };
    }

    abstract protected AbstractLogger _provideLogger(Context context);

    // Retrieve and set application context globally.
    @Override
    public boolean onCreate() {
        Log.d("Phenotype", "onCreate");

        // Set the context.
        _context = getContext().getApplicationContext();

        // Initialize logger.
        AbstractPhenotypeInitProvider.setLogger(_provideLogger(_context));
        _log = AbstractPhenotypeInitProvider.getLogger();

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
        Log.d("Phenotype", "attachInfo");
        // _log.t();

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
    final public Cursor query(@NonNull Uri uri, @Nullable String[] strings, @Nullable String s, @Nullable String[] strings1, @Nullable String s1) {
        return null;
    }

    @Nullable
    @Override
    final public String getType(@NonNull Uri uri) {
        return null;
    }

    @Nullable
    @Override
    final public Uri insert(@NonNull Uri uri, @Nullable ContentValues contentValues) {
        return null;
    }

    @Override
    final public int delete(@NonNull Uri uri, @Nullable String s, @Nullable String[] strings) {
        return 0;
    }

    @Override
    final public int update(@NonNull Uri uri, @Nullable ContentValues contentValues, @Nullable String s, @Nullable String[] strings) {
        return 0;
    }
}