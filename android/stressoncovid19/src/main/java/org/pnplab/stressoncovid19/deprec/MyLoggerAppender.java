package org.pnplab.stressoncovid19.deprec;

import android.content.ContextWrapper;
import android.os.Environment;

import java.io.File;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

import ch.qos.logback.classic.android.SQLiteAppender;

// Inherited logback SQLiteAppender, in order to add programmatic config to
// logging's sqlite storage. SQLiteAppender's EXT_DIR helper rely on android
// deprecated getExternalStorageDirectory method, thus, this has to be
// configured manually.
public class MyLoggerAppender extends SQLiteAppender {

    public MyLoggerAppender() {
        super();

        // Flush log stream older than 2 weeks.
        // @todo would be nice to flush log by fize size through logCleaner
        //     inheritance instead, in order to avoid log spamming.
        this.setMaxHistory("2 weeks");

        // Retrieve context in order to find app's db folder path.
        // @warning dirty method to retrieve context, although taken from
        // AndroidContextUtil of logback-android lib.
        // @todo transfer context instead of relying on reflection on private
        //     android API.
        ContextWrapper context;
        try {
            Class<?> c = Class.forName("android.app.AppGlobals");
            Method method = c.getDeclaredMethod("getInitialApplication");
            context = (ContextWrapper) method.invoke(c);
        }
        catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException | InvocationTargetException e) {
            throw new IllegalStateException("Couldn't retrieve context through android.app.AppGlobals#getInitialApplication reflection");
        }

        // Assert context exists.
        if (context == null) {
            throw new IllegalStateException("Retrieving context through android.app.AppGlobals#getInitialApplication reflection returned null");
        }

        // Set db file path.
        // Pick external storage folder if available (as there is more space in
        // external storage then internal).
        //
        // @note
        // #getExternalStorageDirectory is deprecated as API 29 for privacy
        // reason. #getExternalFilesDir is not and is more privacy-friendly,
        // although any app w/ READ_EXTERNAL_STORAGE still can read them (quite
        // nice for log retrieval in case of issue though)!
        // cf. https://developer.android.com/reference/android/os/Environment.html#getExternalStorageDirectory()
        // cf. https://developer.android.com/reference/android/content/Context#getExternalFilesDir(java.lang.String)
        String dbExtlessFileName = "log";
        File dbFolder;
        if (Environment.getExternalStorageState().equals(android.os.Environment.MEDIA_MOUNTED) && context.getExternalFilesDir("sqlite") != null) {
            dbFolder = context.getExternalFilesDir("sqlite");
        }
        else {
            dbFolder = new File(context.getFilesDir(), "sqlite");
        }
        if (dbFolder != null && !dbFolder.exists()) {
            dbFolder.mkdirs();
        }
        if (dbFolder == null){
            throw new IllegalStateException(String.format("Couldn't create sqlite folder for table %s.", dbExtlessFileName));
        }
        String sqliteDBPath = String.format("%s/%s.db", dbFolder.getAbsolutePath(), dbExtlessFileName);

        this.setFilename(sqliteDBPath);
    }
}
