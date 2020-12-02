package org.pnplab.stressoncovid19;

import android.content.Context;

import org.pnplab.phenotype.logger.AbstractLogger;
import org.pnplab.phenotype.system.core.AbstractPhenotypeInitProvider;

public class PhenotypeInitProvider extends AbstractPhenotypeInitProvider {

    private static MyLogger _log;

    public static AbstractLogger getLogger() {
        return PhenotypeInitProvider._log;
    }

    @Override
    protected AbstractLogger _provideLogger(Context context) {
        MyLogger logger = new MyLogger();
        logger.initialize(context);

        PhenotypeInitProvider._log = logger;
        return logger;
    }

}
