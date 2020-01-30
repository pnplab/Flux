package org.pnplab.phenotype.system.entrypoints;

import android.content.Context;

import org.pnplab.phenotype.logger.AbstractLogger;
import org.pnplab.phenotype.logger.DefaultLogger;

public class DefaultPhenotypeInitProvider extends AbstractPhenotypeInitProvider {

    @Override
    protected AbstractLogger _provideLogger(Context context) {
        DefaultLogger logger = new DefaultLogger();
        logger.initialize(context);
        return logger;
    }

}
