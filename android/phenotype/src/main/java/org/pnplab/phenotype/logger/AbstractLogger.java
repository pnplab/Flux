package org.pnplab.phenotype.logger;

import android.content.Context;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.Writer;

/**
 * @warning
 * Implementation must be thread safe.
 */
public abstract class AbstractLogger {
    public abstract void initialize(Context context);
    
    abstract public void i(String msg);
    abstract public void e(String msg);
    abstract public void w(String msg);
    abstract public void d(String msg);
    abstract public void v(String msg);
    abstract public void wtf(String msg);

    public abstract void t();

    // #exc is an helper method to display throwable stacktraces easily. These
    // requires verbose code through mandatory usage of PrintWriter to retrieve
    // stacktrace.
    // This is useful to write exceptions swallowed by rxjava (reactive
    // functional API).
    public void exc(Throwable exc) {
        // Stream stacktrace output and cache it then display it (streaming is
        // the only available output methodology Throwable API provides).
        Writer out = new Writer() {
            StringBuffer _strBuffer = new StringBuffer();

            @Override
            public void write(char[] cbuf, int off, int len) throws IOException {
                _strBuffer.append(cbuf, off, len);
            }

            @Override
            public void flush() throws IOException {
            }

            @Override
            public void close() throws IOException {
                e(_strBuffer.toString());
            }
        };

        // Generate stream, send stacktrace and flush/close straight away.
        PrintWriter p = new PrintWriter(out);

        // Display exc.
        String message = exc.getMessage();
        if (message != null) {
            p.println(exc.getMessage());
        }
        // Display stacktrace.
        exc.printStackTrace(p);
        p.flush();
        p.close();
    }
}
