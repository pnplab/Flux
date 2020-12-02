package org.pnplab.stressoncovid19;

import android.content.Context;
import android.text.TextUtils;

import org.pnplab.phenotype.logger.AbstractLogger;

import java.util.LinkedList;
import java.util.Queue;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MyLogger extends AbstractLogger {

    @Override
    public void initialize(Context context) {
        org.slf4j.Logger log = LoggerFactory.getLogger(MainActivity.class);
        log.info("hello world");

    }

    @Override
    public void i(String msg) {

    }

    @Override
    public void e(String msg) {

    }

    @Override
    public void w(String msg) {

    }

    @Override
    public void d(String msg) {

    }

    @Override
    public void v(String msg) {

    }

    @Override
    public void wtf(String msg) {

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
    }

    private String _getShortClassName(String fullClassName) {
        int classNameIndexInString = fullClassName.lastIndexOf('.') + 1;
        return fullClassName.substring(classNameIndexInString);
    }
}
