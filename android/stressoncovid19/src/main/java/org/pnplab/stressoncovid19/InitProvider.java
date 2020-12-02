package org.pnplab.stressoncovid19;

import android.content.Context;

import org.pnplab.phenotype.logger.AbstractLogger;
import org.pnplab.phenotype.core.AbstractInitProvider;

public class InitProvider extends AbstractInitProvider {

    private static MyLogger _log;

    public static AbstractLogger getLogger() {
        return InitProvider._log;
    }

    @Override
    protected AbstractLogger _provideLogger(Context context) {
        MyLogger logger = new MyLogger();
        logger.initialize(context);

        InitProvider._log = logger;
        return logger;
    }

}
