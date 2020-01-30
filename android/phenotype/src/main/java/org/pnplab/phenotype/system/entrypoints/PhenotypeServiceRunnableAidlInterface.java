package org.pnplab.phenotype.system.entrypoints;

import remoter.annotations.Oneway;
import remoter.annotations.Remoter;

@Remoter
public interface PhenotypeServiceRunnableAidlInterface {
    @Oneway
    void run();
}
