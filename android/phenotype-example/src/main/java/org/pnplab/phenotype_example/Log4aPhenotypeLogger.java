package org.pnplab.phenotype_example;

import android.content.Context;
import android.os.Environment;
import android.text.TextUtils;
import android.util.Log;

import org.pnplab.phenotype.logger.AbstractLogger;

import java.io.File;
import java.util.LinkedList;
import java.util.Queue;

import me.pqpo.librarylog4a.Level;
import me.pqpo.librarylog4a.Log4a;
import me.pqpo.librarylog4a.appender.FileAppender;
import me.pqpo.librarylog4a.logger.AppenderLogger;

public class Log4aPhenotypeLogger extends AbstractLogger {

    @Override
    public void initialize(Context context) {
        // context.getFilesDir() + "/log.txt"
        File bufferFile;
        if (Environment.getExternalStorageState().equals(android.os.Environment.MEDIA_MOUNTED)
                && context.getExternalFilesDir("log4a") != null) {
            bufferFile = context.getExternalFilesDir("log4a");
        } else {
            bufferFile = new File(context.getFilesDir(), "log4a");
        }
        if (bufferFile != null && !bufferFile.exists()) {
            bufferFile.mkdirs();
        }
        String filePath = new File(bufferFile, "log.txt").getAbsolutePath();

        FileAppender appender = new FileAppender
                .Builder(context)
                .addInterceptor(logData -> {
                    if (logData.logLevel >= Level.VERBOSE) {
                        Log.i(logData.tag, logData.msg);
                    }
                    return true;
                })
                .setLogFilePath(filePath)
                .create();

        AppenderLogger logger = new AppenderLogger
                .Builder()
                .addAppender(appender)
                .create();

        Log4a.setLogger(logger);

        this.i("Logger set to log4a.");
    }

    @Override
    public void i(String msg) {
        Log4a.i("Phenotype", msg);
    }

    @Override
    public void e(String msg) {
        Log4a.e("Phenotype", msg);
    }

    @Override
    public void w(String msg) {
        Log4a.w("Phenotype", msg);
    }

    @Override
    public void d(String msg) {
        Log4a.d("Phenotype", msg);
    }

    @Override
    public void v(String msg) {
        Log4a.v("Phenotype", msg);
    }

    @Override
    public void wtf(String msg) {
        Log4a.e("Phenotype", msg);
    }

    @Override
    public void t() {
        StackTraceElement[] stacktrace = Thread.currentThread().getStackTrace();

        // Get current timestamp.
        String timestamp = "" + System.currentTimeMillis();

        // List method calls until given limit.
        Queue<String> callStack = new LinkedList<>();
        int fromStackItemIndex = 4; // this method callee.
        int untilStackItemIndex = Math.min(stacktrace.length, fromStackItemIndex + 2); // max 1 call stack item to not be too verbose.
        for (int i = fromStackItemIndex; i < untilStackItemIndex; ++i) {
            StackTraceElement stacktraceItem = stacktrace[i];
            String stacktraceItemStr = stacktraceItem.getMethodName() + " (" + _getShortClassName(stacktraceItem.getClassName()) + ")";
            callStack.add(stacktraceItemStr);
        }
        String callStackStr = TextUtils.join(" < ", callStack);

        Log4a.v("Phenotype", callStackStr);
    }

    private String _getShortClassName(String fullClassName) {
        int classNameIndexInString = fullClassName.lastIndexOf('.') + 1;
        return fullClassName.substring(classNameIndexInString);
    }
}
