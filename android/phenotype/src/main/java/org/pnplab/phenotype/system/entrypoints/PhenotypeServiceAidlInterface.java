package org.pnplab.phenotype.system.entrypoints;

import remoter.annotations.Remoter;

/**
 * We use AIDL to allow for cross-process synchronous code execution. Android's
 * Messenger alternative is asynchronous by nature. Using AIDL implies
 * developing our layer code with thread-safety since the synchronous aidl code
 * is parallelly executed.
 *
 * see docs here https://github.com/josesamuel/remoter and here
 * https://developer.android.com/guide/components/aidl
 */
@Remoter
public interface PhenotypeServiceAidlInterface {
    boolean isStartingForBackground();
    boolean isStartedForBackground();
    void stopForBackground();
    void startForBackground();
    void startForBackground(PhenotypeServiceRunnableAidlInterface onServiceStarted);
    void startForBackground(PhenotypeServiceRunnableAidlInterface onServiceStarted, PhenotypeServiceErrorConsumerAidlInterface onServiceStartFailed);
}
