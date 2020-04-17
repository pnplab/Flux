package org.pnplab.phenotype;

import android.content.Context;
import android.os.RemoteException;

import org.pnplab.phenotype.logger.AbstractLogger;
import org.pnplab.phenotype.logger.DefaultLogger;
import org.pnplab.phenotype.system.entrypoints.AbstractPhenotypeService;
import org.pnplab.phenotype.system.entrypoints.PhenotypeServiceClient;

import java9.util.function.BiConsumer;
import java9.util.function.Consumer;

// Service = main interface! with aidl-like api, doesn't imply we have to keep
// the motor running 24/7.
// Load and access the phenotype service API.

// In case of Application check : https://stackoverflow.com/questions/15545345/using-androidprocess-remote-recreates-android-application-object
public class Phenotype {

    public static void initialize(Context context) {
        // AbstractLogger logger = AbstractPhenotypeInitProvider.getLogger();
        // logger.initialize(context);
        AbstractLogger logger = new DefaultLogger();
        _client = new PhenotypeServiceClient(context, logger);
    }

    // onError is optional for synchronous usage.
    public static void Phenotype(Consumer<AbstractPhenotypeService.ClientAPI> onLoaded) {
        _client.bindService(
                (aidlInterface, unbind) -> {
                    // Forward callback.
                    onLoaded.accept(aidlInterface);

                    // Unbind.
                    // @note in order for unbind to always be called, one
                    // should watch out for aidlInterface calls'
                    // RemoteException/DeadObjectException wrapped inside
                    // RuntimeException by remoter. However, onError is
                    // automatically called and unbind is thus triggered at
                    // this point, rendering such precautions optional.
                    unbind.run();
                },
                error -> {
                    // do nothing.
                }
        );
    }

    public static void Phenotype(Consumer<AbstractPhenotypeService.ClientAPI> onLoaded, Consumer<RuntimeException> onError) {
        _client.bindService(
                (aidlInterface, unbind) -> {
                    // Forward callback.
                    try {
                        onLoaded.accept(aidlInterface);
                    }
                    catch (Exception exc) {
                        if (exc.getCause() instanceof RemoteException) {
                            onError.accept(new RuntimeException(exc));
                        }
                        else {
                            throw exc;
                        }
                    }

                    // Unbind.
                    // @note in order for unbind to always be called, one
                    // should watch out for aidlInterface calls'
                    // RemoteException/DeadObjectException wrapped inside
                    // RuntimeException by remoter. However, onError is
                    // automatically called and unbind is thus triggered at
                    // this point, rendering such precautions optional.
                    unbind.run();
                },
                error -> {
                    // Forward callback.
                    onError.accept(error);
                }
        );
    }

    // onError is mandatory for asynchronous usage. Indeed asynchronous code
    // should check whether the connection is still opened or not when using it.
    public static void Phenotype(BiConsumer<AbstractPhenotypeService.ClientAPI, Runnable> onLoaded, Consumer<RuntimeException> onError) {
        _client.bindService(
                (aidlInterface, unbind) -> {
                    // Forward callback.
                    onLoaded.accept(aidlInterface, unbind);

                    // ...unbind responsibility is left to the user and has
                    // been forwarded through callback.
                },
                error -> {
                    // Forward callback.
                    onError.accept(error);
                }
        );
    }

    /*
    public boolean isRunning() {
        return _aidlInterface.isBackgroundModeStarting() || _aidlInterface.isBackgroundModeStarted();
    }

    public void start() {
        _aidlInterface.startBackgroundMode();
    }
    public void start(Runnable onServiceStarted) {
        _aidlInterface.startBackgroundMode(() -> onServiceStarted.run());
    }
    public void start(Runnable onServiceStarted, Consumer<RuntimeException> onServiceStartFailed) {
        _aidlInterface.startBackgroundMode(() -> onServiceStarted.run(), error -> onServiceStartFailed.accept(error));
    }

    public void startPedometerRecording() {
        _aidlInterface.startPedometerRecording();
    }

    public void stop() {
        _aidlInterface.stopBackgroundMode();
    }

    private static PhenotypeServiceClient _client = null;
    private final AbstractPhenotypeService.ClientAPI _aidlInterface;
    private Phenotype(PhenotypeServiceAidlInterface aidlInterface) {
        _aidlInterface = aidlInterface;
    }
    */

    private static PhenotypeServiceClient _client = null;
    private Phenotype() {
        // ... prevent instantiation.
    }

}
