package org.pnplab.flux.awarecore;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Binder;
import android.os.IBinder;
import android.util.Log;

import com.aware.Aware;
import com.aware.utils.StudyUtils;

import org.robolectric.Robolectric;
import org.robolectric.android.controller.IntentServiceController;
import org.robolectric.android.controller.ServiceController;

import static org.robolectric.Shadows.shadowOf;

public class AwareMock extends Aware {
    public AwareMock() {
        super();
    }

    // We need to implement binder in Aware service in order to be able to use JUnit ServiceTestRule
    // to launch the service synchronously and thus make it testable. This is optional when we use
    // Robolectric setupService instead.

    @Override
    public IBinder onBind(Intent intent) {
        return mBinder;
    }

    private final IBinder mBinder = new LocalBinder();
    public class LocalBinder extends Binder {
        AwareMock getService() {
            return AwareMock.this;
        }
    }

    public static class mock {

        public static void joinStudySync(Context context, String studyUrl) {
            // Register broadcast for study joined.
            BroadcastReceiver broadcastReceiver = new BroadcastReceiver() {
                @Override
                public void onReceive(Context context, Intent intent) {
                    // Unregister receiver on first event received ! (listen only once)
                    context.unregisterReceiver(this);

                    // Make the thread trigger unlock!
                    Log.d("tag", "far after join study (while! async)");
                    // @todo ...
                }
            };
            IntentFilter filter = new IntentFilter();
            filter.addAction(AwareMock.ACTION_JOINED_STUDY);
            context.registerReceiver(broadcastReceiver, filter);

            Log.d("tag", "before join study start");

            // Join study.
            // AwareMock.joinStudy(context, studyUrl);
            Intent intent = new Intent(context, JoinStudy.class);
            intent.putExtra(StudyUtils.EXTRA_JOIN_STUDY, studyUrl);

            // Create JoinStudy service.
            // ServiceController<JoinStudy> joinStudyServiceCtrl = Robolectric.buildService(JoinStudy.class, intent);
            IntentServiceController<JoinStudy> joinStudyServiceCtrl = Robolectric.buildIntentService(JoinStudy.class, intent);
            JoinStudy joinStudyService = joinStudyServiceCtrl.get();

            // Pipe joinStudyService on the main thread's Looper queue and tick for it once current
            // thread is available. -- see stopAwareSync method for more details on the underlying
            // mechanism.
            //
            // @warning This test doesn't replicate the parallelistic nature of Android Service
            // Intent! Robolectric wrapper of IntentService are run asynchronously but serially
            // from the rest of the code (both test and user's code) on the main thread. While this
            // is by default the case of normal android *standard services*. It is not the case of
            // android *intent services* which are launched by default on worked thread and thus
            // run asynchronously and parallely from the rest!
            //
            // @note Only handleIntent call is usefull here as the other lifecycle methods aren't
            // implemented. It's still a good practice to test the full lifecycle mechanism in case
            // of change.
            joinStudyServiceCtrl.create();
            joinStudyServiceCtrl.startCommand(0, 0);
            joinStudyServiceCtrl.handleIntent();
            joinStudyServiceCtrl.destroy();

            // Idle to enable broadcast.
            // shadowOf(Looper.getMainLooper()).idle();

            Log.d("tag", "after join study start");
        }

        private static AwareMock service = null;
        private static ServiceController<AwareMock> serviceController = null;
        public static void startAwareSync(Context context) {
            // Start service with Robolectric so the launch is synchronous.
            // service = Robolectric.setupService(AwareMock.class);
            serviceController = Robolectric.buildService(AwareMock.class);
            service = Robolectric.buildService(AwareMock.class).get();

            // Put onCreate on the main thread's Looper queue and tick for it once current
            // thread is available. -- see stopAwareSync method for more details on the underlying
            // mechanism.
            //
            // @note This test replicates the serial nature of android *standard services* and
            // replicates the asynchronous nature of android main thread Looper mechanism using
            // fake Robolectric looper mechanism.
            serviceController.create();
            serviceController.startCommand(0, 0);

            // ...which is equivalent to JUnit startService rule but requires the service to implement
            //    a service binder (and there might not be automatic teardown).
            // Intent aware = new Intent(context, service.getClass());
            // serviceRule.startService(aware);

            // ...in comparison to normal launch.
            // Intent aware = new Intent(context, Aware.class);
            // context.startService(aware);

            // Start aware sensor services.
            // This method *do NOT* call context.startService on Aware.class!
            AwareMock.startAWARE(context);

            // @warning These tests lack permission granting mechanism for now.
        }

        public static void stopAwareSync(Context context) {
            // Call stopAWARE to stop aware sensor services.
            // This method *DO* call context.stopService on Aware.class!
            //
            // From looking at source code, Robolectric seems to work at such: context is Shadowed.
            // A call to stopService in client source code is overriden such as to be sent to
            // ShadowInstrumentation#stopService and provide mechanism to test the call of the
            // stopService ShadowContextWrapper#getNextStoppedService() which rely on
            // ShadowInstrumentation#getNextStoppedService() through a queue of stoppedService.
            // Except in the way written above, #getNextStoppedService() methods are never used by
            // Robolectric and thus are _ONLY_ intendend for the end user. However, the call is not
            // forwarded to the android main thread Looper as it would be expected ! Thus onDestroy
            // is ignored, not because it's in waiting queue, but because it's never called ! Thus,
            // relying on shadowOf(Looper.getMainLooper()).idle(); wont work to pop it out.
            // Solution is to call the onDestroy manually through robolectric's ServiceController.
            AwareMock.stopAWARE(context);

            // Considering,
            // - Test code, source code and most android lifecycle mechanisms such as services and
            // broadcasts are run by default on the default thread, called either main thread or
            // UI thread. This is not the case when intent services are used (as opposed to
            // services) or multithreading is explicitely implemented in the client and
            // dependency's source code. For the record, this is not the case at any time for Aware
            // except probably for network calls.
            // - Consider the usual android main thread Looper mechanism that schedules all these
            // asynchronous codes on the same thread is shadowed by robolectric to be controlled
            // manually during testing.
            //
            // The following method call does two things:
            // - First, it puts `Aware#onDestroy` on the main thread's Looper's queue.
            // - Secondly, it ticks the android main looper mechanism by one step once the thread
            // is idle in order to execute the onDestroy call (hopefully, looks like it could go
            // wrong if the queue is not empty to begin with :)) For the record, Robolectric uses
            // the word `idle` in two antagonistic ways - either as a `tick clock` action or as a
            // state of rest.
            serviceController.destroy();
        }
    }

}
