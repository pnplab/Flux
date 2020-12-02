package org.pnplab.phenotype.core;

import remoter.annotations.Oneway;
import remoter.annotations.Remoter;

/*
 * AIDL interface for Java functional Runnable (in order to be able to pass
 * function callbacks between android components, such as services and
 * activities).
 */
@Remoter
public interface AIDLRunnable {
    @Oneway
    void run();
}
