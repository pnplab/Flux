package org.pnplab.phenotype_example;

import android.content.Context;

import org.pnplab.phenotype.logger.AbstractLogger;
import org.pnplab.phenotype.system.entrypoints.AbstractPhenotypeInitProvider;

public class PhenotypeInitProvider extends AbstractPhenotypeInitProvider {

    @Override
    protected AbstractLogger _provideLogger(Context context) {
        Log4aPhenotypeLogger logger = new Log4aPhenotypeLogger();
        logger.initialize(context);
        return logger;
    }

}
