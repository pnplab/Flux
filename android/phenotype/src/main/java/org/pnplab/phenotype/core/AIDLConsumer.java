package org.pnplab.phenotype.core;

import remoter.annotations.Oneway;
import remoter.annotations.Remoter;

/*
 * AIDL interface for Java functional Consumer (in order to be able to pass
 * function callbacks between android components, such as services and
 * activities).
 *
 * Mostly used to pass exception/errors in our case.
 */
@Remoter
public interface AIDLConsumer<T> {
    // @note Oneway annotation makes the call asynchronous (non-blocking).
    @Oneway
    void accept(T error);
}
