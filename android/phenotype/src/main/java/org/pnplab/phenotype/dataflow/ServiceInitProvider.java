package org.pnplab.phenotype.dataflow;

import android.content.Context;

import org.pnplab.phenotype.core.AbstractInitProvider;
import org.pnplab.phenotype.logger.AbstractLogger;
import org.pnplab.phenotype.logger.DefaultLogger;

public class ServiceInitProvider extends AbstractInitProvider {

    @Override
    protected AbstractLogger _provideLogger(Context context) {
        DefaultLogger logger = new DefaultLogger();
        logger.initialize(context);
        return logger;
    }

}
