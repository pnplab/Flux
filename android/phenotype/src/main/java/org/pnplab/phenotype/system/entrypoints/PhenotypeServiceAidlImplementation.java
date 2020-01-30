package org.pnplab.phenotype.system.entrypoints;

/**
 * @warning
 * Exception in implementation for non oneway aidl methods are swallowed by
 * android and rethrown in client. The exception types allowed seems only to be
 * SecurityException, BadParcelableException, IllegalArgumentException,
 * NullPointerException, IllegalStateException, NetworkOnMainThreadException,
 * UnsupportedOperationException. Otherwise, exception seems to be converted
 * to RuntimeException with random message.
 *
 * > Some runtime exceptions in AIDL service implementations are swallowed in
 * > the service process, and will not cause a crash of the service, thereby
 * > bypassing crash reporting.
 * >
 * > Despite the documentation stating otherwise, these runtime exceptions are
 * > propagated back to the client app, and can be the cause of client app
 * > crashes and also information leakage, perhaps in the form of an
 * > embarassing exception message such as error handling not implemented yet.
 * cf. https://blog.classycode.com/dealing-with-exceptions-in-aidl-9ba904c6d63
 *
 * @warning
 * *However, Remoter fixes that!*
 * > Interface methods can throw any exceptions. Clients will get the same
 * > exception that is thrown.
 * cf. https://github.com/josesamuel/remoter
 */
public class PhenotypeServiceAidlImplementation implements PhenotypeServiceAidlInterface {

    private final AbstractPhenotypeService _service;

    public PhenotypeServiceAidlImplementation(AbstractPhenotypeService abstractPhenotypeService) {
        _service = abstractPhenotypeService;
    }

    @Override
    synchronized public boolean isStartingForBackground() {
        return _service.isStartingForBackground();
    }

    @Override
    synchronized public boolean isStartedForBackground() {
        return _service.isStartedForBackground();
    }

    @Override
    synchronized public void stopForBackground() {
        // @warning will fail if start was called just before due to async.
        _service.stopForBackground();
    }

    @Override
    synchronized public void startForBackground() {
        // @warning will fail if start was called just before due to async.
        _service.startForBackground();
    }

    @Override
    synchronized public void startForBackground(PhenotypeServiceRunnableAidlInterface onServiceStarted) {
        _service.startForBackground(() -> onServiceStarted.run());
    }

    @Override
    synchronized public void startForBackground(PhenotypeServiceRunnableAidlInterface onServiceStarted, PhenotypeServiceErrorConsumerAidlInterface onServiceStartFailed) {
        _service.startForBackground(() -> onServiceStarted.run(), (error) -> onServiceStartFailed.accept(error));
    }
}
