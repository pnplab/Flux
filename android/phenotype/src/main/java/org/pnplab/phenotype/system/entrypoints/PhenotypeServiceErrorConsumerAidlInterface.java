package org.pnplab.phenotype.system.entrypoints;

import remoter.annotations.Oneway;
import remoter.annotations.Remoter;

@Remoter
public interface PhenotypeServiceErrorConsumerAidlInterface {
    @Oneway
    void accept(RuntimeException error);
}
