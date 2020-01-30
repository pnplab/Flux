package org.pnplab.phenotype.logger;

import android.content.Context;

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
}
