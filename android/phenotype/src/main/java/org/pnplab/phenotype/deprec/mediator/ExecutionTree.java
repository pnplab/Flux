package org.pnplab.phenotype.deprec.mediator;

import android.content.Context;

// This class serves as a way to centralise dataflow.
// possible use:
// - change dataflow to optimise battery based on user's phone model.
// - set different data acquisition flow for different user.
public class ExecutionTree {

    // https://developer.android.com/guide/components/bound-services#Messenger

    public void generate(Context context) {
    /*
        Reboot = sequenceOf(ProcessInit, BootCompleted);
        CrashRecover = sequenceOf(ProcessInit, BackgroundServiceInited);
        UserLaunch = when(ProcessInit).then(API);

        when(Reboot,CrashRecover,UserLaunch )

        on(ProcessInit, BootCompleted).do(launchService);
        on(ProcessInit, API, BackgroundServiceInited).do(launchService);
        on(ProcessInit, BackgroundServiceInited).do(launchService);

        on(ProcessInit)
            .do(loadBugsnag,
                once(BootCompleted).do(launchService),
                once(serviceLaunched).do(  ) // could be without service launched!
                )
            .to(BootCompleted)
            .to(BackgroundService)
        from(DEAD).transit(
            on(ProcessInitContentProvider).to(BUGSNAG_LOADED).transit(
                on(BootCompletedBroadcastReceiver).to(APP_LOADED)
            )
        )

        // q? how to inject dep ?
        on(AppInitContentProvider.class, () -> {
            setupBugsnag();
        });

        on(ProcessInitContentProvider.class, () -> {
            setupBugsnag();

            on(API::start, () -> {
                setupBugsnag();
                WakelockStickyForegroundService.start();
            });
        });

        on(BootCompletedBroadcastReceiver.class, () -> {
            WakelockStickyForegroundService.start();

            on(API::start, () -> {
                setupBugsnag();
                WakelockStickyForegroundService.start();
            });
        });

        on(WakelockStickyForegroundService.class, () -> {
            if (inContextOfStickyReboot) {

            }
            launch(Sensing.class);
        });

        on(BootCompletedBroadcastReceiver::onReceive, () -> {
            setupBugsnag();
            activate(WakelockStickyForegroundService);
        });
        on(WakelockStickyForegroundService::onStart, () -> {
            // WakefulBroadcastReceiver.start();
        });

        on(DataAcquisition::onReceive, (data) -> {
            db.push(data);
        });
        AccessibilityService.onStart(() -> {

        });
        */
    }
    public void trigger() {

    }
    public void stop() {

    }
}
