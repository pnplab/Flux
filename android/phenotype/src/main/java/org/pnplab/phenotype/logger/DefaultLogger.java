package org.pnplab.phenotype.logger;

import android.content.Context;
import android.text.TextUtils;
import android.util.Log;

import java.util.LinkedList;
import java.util.Queue;

public class DefaultLogger extends AbstractLogger {

    @Override
    public void initialize(Context context) {
        this.i("Logger set to DefaultLogger.");
    }

    @Override
    public void i(String msg) {
        Log.i("Phenotype", msg);
    }

    @Override
    public void e(String msg) {
        Log.e("Phenotype", msg);
    }

    @Override
    public void w(String msg) {
        Log.w("Phenotype", msg);
    }

    @Override
    public void d(String msg) {
        Log.d("Phenotype", msg);
    }

    @Override
    public void v(String msg) {
        Log.v("Phenotype", msg);
    }

    @Override
    public void wtf(String msg) {
        Log.wtf("Phenotype", msg);
    }

    @Override
    public void t() {
        StackTraceElement[] stacktrace = Thread.currentThread().getStackTrace();

        // Get current timestamp.
        String timestamp = "" + System.currentTimeMillis();

        // List method calls until given limit.
        Queue<String> callStack = new LinkedList<>();
        int fromStackItemIndex = 3; // this method callee.
        int untilStackItemIndex = Math.min(stacktrace.length, fromStackItemIndex + 2); // max 2 call stack item to not be too verbose.
        for (int i = fromStackItemIndex; i < untilStackItemIndex; ++i) {
            StackTraceElement stacktraceItem = stacktrace[i];
            String stacktraceItemStr = stacktraceItem.getMethodName() + " (" + _getShortClassName(stacktraceItem.getClassName()) + ")";
            callStack.add(stacktraceItemStr);
        }
        String callStackStr = TextUtils.join(" < ", callStack);

        // Log verbosely.
        Log.v("Phenotype", timestamp + " " + callStackStr);
    }

    private String _getShortClassName(String fullClassName) {
        int classNameIndexInString = fullClassName.lastIndexOf('.') + 1;
        return fullClassName.substring(classNameIndexInString);
    }

}
