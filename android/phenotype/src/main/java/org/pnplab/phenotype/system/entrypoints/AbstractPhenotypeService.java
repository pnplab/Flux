package org.pnplab.phenotype.system.entrypoints;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.res.Resources;
import android.os.Binder;
import android.os.Build;
import android.os.IBinder;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import org.pnplab.phenotype.BuildConfig;
import org.pnplab.phenotype.R;
import org.pnplab.phenotype.logger.AbstractLogger;

import java.util.Timer;
import java.util.TimerTask;
import java9.util.function.Consumer;
import remoter.annotations.Remoter;

/**
 * This is our lib's main android entrypoint.
 *
 * Although composition should be used in favor of inheritance, due to android
 * architecture limitation, we're using polymorphism where it should be avoided.
 *
 * Our lib is extended through this class' inheritance. Considering services
 * can crash and be restarted by the OS, compositional dataflow ran from
 * previously external android activity entrypoints would not be then executed
 * again. We thus rely on the service inheritance ensure the lib's dataflow
 * can be modified/extended while still always being re-executed on phone
 * restart.
 * Other options are available, such as storing the dataflow configuration in
 * an external file to be able to restore it later on. However, we find this
 * solution either less flexible or less secure depending on its implementation.
 *
 * Consider this class main responsibility as a source code entrypoint.
 * cf. http://web.archive.org/web/20180505121013/https://plus.google.com/+DianneHackborn/posts/FXCCYxepsDU
 *
 * We set up the service in a remote process in order to
 * - prevent any memory leak from the user application (and dependencies) to
 *   spread to the potentially always-alive service process.
 * - prevent other app services to benefits from the foreground privileges
 *   and battery bypass granted to this service. although not documented, we
 *   indeed have strong reason to believe the foreground privileges are granted
 *   at process level by android (cf. android source code comments of
 *   service.java).
 * - prevent any crash from our lib to impact the usage of the user application.
 *
 * @warning
 * Android 7+ direct boot mode is not enabled in manifest. This implies the
 * service can't restart after reboot until the phone has been unlocked by the
 * user.
 * cf https://developer.android.com/training/articles/direct-boot
 *
 * @todo
 * read https://android.jlelse.eu/defending-your-app-310428698cfe
 * read https://android.jlelse.eu/android-application-launch-explained-from-zygote-to-your-activity-oncreate-8a8f036864b
 * read https://support.mileiq.com/hc/en-us/articles/209974743-Optimize-Drive-Detection-on-Android-Phones
 */
abstract public class AbstractPhenotypeService extends Service {

    /**
     * The Client API of the service, as used by the user of the lib, likely
     * through android activities.
     *
     * We use AIDL to allow for cross-process synchronous code execution, which
     * we find easier for the service user and for debugging. Android's Messenger
     * alternative is asynchronous by nature.
     *
     * @note
     * An inherited or overloaded version of this interface can be set by the
     * library user through a method overload of the onBind method (See
     * underlying onBind comments as well as implementation class ones).
     *
     * @warning
     * The @Remoter annotation will generate ClientAPI_Stub and ClientAPI_Proxy
     * global classes (outside of this inner class scope). Thus, if redefined
     * with the same name in a subclass, be aware of the undetected class
     * import conflict name that may occur, especially since these classes will
     * only be generated after a first build phase.
     *
     * @warning
     * Using AIDL implies developing our layer code with thread-safety since
     * the synchronous aidl code is parallelly executed. Asynchronicity should
     * be taken in consideration as it may impact thread-safeness (see
     * implementation comments for example).
     *
     * see docs here https://github.com/josesamuel/remoter and here
     * https://developer.android.com/guide/components/aidl
     */
    @Remoter
    public interface ClientAPI {
        boolean isBackgroundModeStarting();
        boolean isBackgroundModeStarted();
        // @warning
        // call could fail due to async for start/stop* methods when a
        // start/stop method has just been called beforehand. Consider using
        // the method's callbacks to avoid this trap.
        void stopBackgroundMode();
        void startBackgroundMode();
        void startBackgroundMode(AIDLRunnable onServiceStarted);
        void startBackgroundMode(AIDLRunnable onServiceStarted, AIDLConsumer<RuntimeException> onServiceStartFailed);
    }

    /**
     * The implementation of our service API. This *adds a layer of thread
     * safety* while making the link between our service and its API.
     *
     * For now, we consider this implementation thread-safe, as
     * - the sole user of the process is a single lib's user (whether user's
     *   app, android system launch callback, ...).
     * - none of the inner asynchronous methods of the lib affects states
     *   related to the one used by the API.
     *
     * @warning
     * If at any point, inner service asynchronous/delayed methods affect same
     * states as API does, this will break service thread-safe!
     * @todo move out.
     *
     * @note
     * *The Remoter lib prevents the bellow notes targeted to android AIDL!*
     * > Interface methods can throw any exceptions. Clients will stream the same
     * > exception that is thrown.
     * cf. https://github.com/josesamuel/remoter
     *
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
     * @note
     * This class is set as protected to be easily inherited by the lib user
     * through the phenotype service subclass. This requires to redefine the
     * onBind method as well.
     */
    protected class ClientImpl implements ClientAPI {
        // *BackgroundMode means the start of the service is intending to last
        // after application exit. Although technically the android service as
        // already been started because it has been bound to in order to retrieve
        // its interface.
        @Override
        synchronized public boolean isBackgroundModeStarting() {
            return AbstractPhenotypeService.this.isBackgroundModeStarting();
        }

        @Override
        synchronized public boolean isBackgroundModeStarted() {
            return AbstractPhenotypeService.this.isBackgroundModeStarted();
        }

        @Override
        synchronized public void stopBackgroundMode() {
            // @warning will fail if start was called just before due to async.
            AbstractPhenotypeService.this.stopBackgroundMode();
        }

        @Override
        synchronized public void startBackgroundMode() {
            // @warning will fail if start was called just before due to async.
            AbstractPhenotypeService.this.startBackgroundMode();
        }

        @Override
        synchronized public void startBackgroundMode(AIDLRunnable onServiceStarted) {
            AbstractPhenotypeService.this.startBackgroundMode(() -> {
                // @note although synchronize java block are reentrant locks,
                // no need to make the callback call thread safe here as it
                // wont change/read any of the service state since it strictly
                // calls user code.
                onServiceStarted.run();
            });
        }

        @Override
        synchronized public void startBackgroundMode(AIDLRunnable onServiceStarted, AIDLConsumer<RuntimeException> onServiceStartFailed) {
            AbstractPhenotypeService.this.startBackgroundMode(() -> onServiceStarted.run(), (error) -> {
                // @note although synchronize java block are reentrant locks,
                // no need to make the callback call thread safe here as it
                // wont change/read any of the service state since it strictly
                // calls user code, and the exception error argument is both
                // readonly (mostly) and serialized, thus copied by the
                // Remoter parceler before being sent through AIDL, and thus
                // immutable from our service source code perspective.
                onServiceStartFailed.accept(error);
            });
        }

    }

    private final AbstractLogger _log = AbstractPhenotypeInitProvider.getLogger();

    // Set service as START_STICKY or START_NOT_STICKY.
    private final boolean _restartServiceOnCrash = true;

    /* This methods returns our android service API to the service's user
     * (which is likely to be an android activity within the main process)
     * through android IPC binding with AIDL/Remoter.
     */
    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        _log.t();

        ClientAPI binderImplementation = new ClientImpl();
        Binder binder = new ClientAPI_Stub(binderImplementation);

        return binder;
    }

    /* Flag whether the service is running or not (through context#onStart /
     * context#onStop). This flag might be misleading while the service is
     * ongoing if the service has been bound but not started (@todo check this
     * comment is not outdated).
     *
     * @warning
     * Relying on android context#startService or context#stopService breaks
     * this flag. User should rely on binding connection and then
     * startBackgroundMode instead.
     *
     * @warning
     * better keep these variable private for thread safeness.
     */
    private enum BackgroundState {
        stopped,
        starting,
        started
    }
    private BackgroundState _backgroundState = BackgroundState.stopped;
    private AIDLRunnable _onceStartedCallback = null;
    private AIDLConsumer<RuntimeException> _onceStartFailedCallback = null;
    public synchronized final boolean isBackgroundModeStarting() {
        return _backgroundState == BackgroundState.starting;
    }
    public synchronized final boolean isBackgroundModeStarted() {
        return _backgroundState == BackgroundState.started;
    }

    public synchronized final void startBackgroundMode() {
        _log.t();

        Context context = getApplicationContext();

        // Ensure the service is stopped.
        if (_backgroundState != BackgroundState.stopped) {
            throw new IllegalStateException("Service should be stopped before starting it.");
        }

        // Retrieve the class of the service to start.
        // @note we use getClass to ensure this is the child version of this
        //     class that is started.
        Class<? extends AbstractPhenotypeService> phenotypeServiceClass = getClass();
        Intent intent = new Intent(context, phenotypeServiceClass);

        // Start the service.
        ComponentName componentName;
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            componentName = context.startService(intent);
        }
        // Start the service with temporary permission to launch it from
        // background until the service request promotion to foreground
        // privilege. This temporary permission is mandatory on android O+.
        else {
            componentName = context.startForegroundService(intent);
        }

        // Throw exception if the service doesn't exists. We prefer exception
        // over return value (the solution used by android in
        // #startForegroundService method) since a true value is not a clear
        // indication service start as succeeded (could instead be that its
        // starting step is ongoing) and because other type of failure
        // exceptions might already be thrown. Anyway, the exception shouldn't
        // be possibly thrown as we're already within the specified class, but
        // this is written for safety.
        if (componentName == null) {
            throw new IllegalStateException("Started service doesn't exist");
        }

        // Flag the service as starting.
        _backgroundState = BackgroundState.starting;

        // If service hasn't started within 5 seconds, flag the service as
        // stopped. This delay is the maximum delay android allows to call
        // startForeground.
        Timer timer = new Timer();
        timer.schedule(new TimerTask() {
            @Override
            public void run() {
                // Ignore this if the service has successfully started, and
                // clear error callback.
                if (_backgroundState == BackgroundState.started) {
                    _onceStartFailedCallback = null;
                    return;
                }

                // Store connection failed callback to call it once we have a
                // clean state for our class.
                AIDLConsumer<RuntimeException> onceStartFailedCallback = _onceStartFailedCallback;

                // Clear connection succeed or failed callbacks.
                _onceStartedCallback = null;
                _onceStartFailedCallback = null;

                // Change connection state.
                if (_backgroundState == BackgroundState.starting) {
                    _backgroundState = BackgroundState.stopped;
                }

                // Call connection failed callback if exists.
                // @note it might be set from overriden startBackgroundMode
                // method.
                // @warning This is called from external thread !
                if (onceStartFailedCallback != null) {
                    onceStartFailedCallback.accept(new RuntimeException("Phenotype service start has timed out."));
                }
            }
        }, 5000);
    }

    public synchronized final void startBackgroundMode(AIDLRunnable onceStartedCallback) {
        // Start service for background.
        this.startBackgroundMode();

        // Register callback until it's started.
        _onceStartedCallback = onceStartedCallback;
    }

    public synchronized final void startBackgroundMode(AIDLRunnable onceStartedCallback, AIDLConsumer<RuntimeException> onceStartFailedCallback) {
        // Start service for background.
        this.startBackgroundMode();

        // Register callback until it's or has failed started.
        _onceStartedCallback = onceStartedCallback;
        _onceStartFailedCallback = onceStartFailedCallback;
    }

    /* Stop the service for long term background processing. This method keeps
     * currently bound connections active until they disconnect.
     *
     * This method is to be called instead of context#stopService since it is
     * otherwise not possible to flag if the service is active or not. Indeed,
     * otherwise possible onDestroy callback wouldn't stream called at least until
     * service clients are unbound as well for instance.
     *
     * Throws an exception if service has not fully started for background
     * processing.
     */
    public synchronized final void stopBackgroundMode() {
        _log.t();

        // Throw an exception if service hasn't fully started for background.
        // We need to ensure it has fully started, since otherwise stop doesn't
        // wait for onStartCommand to be called and thus crashes the app
        // through uncatchable RemoteServiceException:
        // `android.app.RemoteServiceException: Context.startForegroundService()
        // did not then call Service.startForeground.`
        // This is a Won't Fix android bug.
        // cf. https://stackoverflow.com/a/49418249/939741
        // cf. https://issuetracker.google.com/issues/76112072
        if (_backgroundState != BackgroundState.started) {
            throw new IllegalStateException("Trying to stop unstarted service.");
        }

        // Stop the service.
        // @note nor stopSelf() nor stopService() does not actually stop the
        //     service until all clients unbind.
        // @note we use context#stopService instead of service#stopSelf in
        //     order to make up for asynchronicity issue that could arise from
        //     calling a delayed context#startService before the synchronous
        //     bound service#stop.
        // @note we use getClass to ensure this is the child version of this
        //     class that is stopped.
        Context context = getApplicationContext();
        Class<? extends AbstractPhenotypeService> serviceClass = getClass();

        Intent intent = new Intent(context, serviceClass);
        boolean wasStarted = context.stopService(intent);
        assert wasStarted;

        _backgroundState = BackgroundState.stopped;

        // Stop the engine.
        this._onBackgroundModeStopped();
    }

    abstract protected void _onBackgroundModeStarted();
    abstract protected void _onBackgroundModeStopped();

    /* Promote the service to foreground priority when created. This prevents
     * android to kill the service if it was created while the app was in
     * background. It might also be necessary to allow it to stay alive once
     * the app has been closed.
     *
     * @note
     * Synchronization might for instance be helpful in this case in the rare
     * edge case where the lib's host application connects to the service while
     * the former is starting from android boot for instance.
     */
    @Override
    @SuppressWarnings("deprecation") // removes Notification.PRIORITY_DEFAULT deprecation warning.
    public synchronized final int onStartCommand(Intent intent, int flags, int startId) {
        super.onStartCommand(intent, flags, startId);

        _log.t();

        try {
            Context context = getApplicationContext();

            // The service has likely crashed and is being restarted by
            // android.
            if (intent == null) {
                _log.i("Service starting with null intent, probably after crash.");

                // Ensure background state is pristine.
                if (_backgroundState != BackgroundState.stopped) {
                    throw new IllegalStateException("The service seems to be " +
                            "restarting after crash, but its state has already " +
                            "been modified. This is weird.");
                }
                // Set background state as starting.
                else {
                    _backgroundState = BackgroundState.starting;
                }
            }
            // The service has been started normally (eg. on phone reboot, or
            // through our lib API via an android activity).
            else {
                _log.d("Service starting.");

                // Ensure service has been called through its bound start
                // method and not android ones to ensure proper state flow
                // since android doesn't provide usable lifecycle callback in
                // this context.
                if (_backgroundState == BackgroundState.stopped) {
                    throw new IllegalStateException("The service is starting " +
                            "but is stated as stopped. Ensure to start it " +
                            "through its #start bound API. Do not use " +
                            "Context#startService. Same goes for stopping it.");
                }
                if (_backgroundState == BackgroundState.started) {
                    throw new IllegalStateException("The service is starting but " +
                            "is stated as already started. Ensure to start it " +
                            "through its #start bound API. Do not use " +
                            "Context#startService. Same goes for stopping it.");
                }
            }

            // Create a notification channel as req. for foreground service on
            // android 8+ (26+). the NotificationChannel class is new and not in
            // the support library.
            // cf. https://stackoverflow.com/a/47549638/939741
            if (Build.VERSION.SDK_INT >= 26) { // Oreo
                // Setup the NotificationChannel.
                String id = BuildConfig.PHENOTYPE_NOTIFICATION_CHANNEL_ID;
                CharSequence name = getString(R.string.phenotype_notification_channel_name);
                String description = getString(R.string.phenotype_notification_channel_description);
                // Default makes a sound. Low makes no sound. Must at least be low
                // for foreground services. Min doesn't show up but is not
                // compatible with foreground services.
                // cf. https://developer.android.com/guide/components/services#Foreground
                int importance = NotificationManager.IMPORTANCE_DEFAULT; // @note API 26 always > 24 for IMPORTANCE_DEFAULT in cond.

                // Create the NotificationChannel.
                NotificationChannel notificationChannel = new NotificationChannel(id, name, importance);
                notificationChannel.setDescription(description);

                // Register the channel with the system; you can't change the importance
                // or other notification behaviors after this
                NotificationManager notificationManager = getSystemService(NotificationManager.class);
                // getSystemService returns null for instant apps using certain
                // service, excluding NotificationManager at the moment. Since
                // we're not an instant app and this is a notification manager,
                // it should always be true.
                assert notificationManager != null;
                notificationManager.createNotificationChannel(notificationChannel);
            }

            // Retrieve application's main activity.
            String packageName = context.getPackageName();
            Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(packageName);
            Class<?> appMainActivityClass = null;
            if (launchIntent != null) {
                ComponentName component = launchIntent.getComponent();
                if (component != null) {
                    try {
                        appMainActivityClass = Class.forName(component.getClassName());
                    } catch (ClassNotFoundException e) {
                        throw new IllegalStateException("Main activity class not found " + component.getClassName());
                    }
                }
            }

            // Launch that activity when user clicks on the notification.
            //
            // @warning
            // setContentIntent seems to be mandatory, but only before android
            // 2.3 (API 10, included).
            // cf. https://stackoverflow.com/a/20032920/939741
            //
            // @warning
            // Lib may crash in case application has no main launch activity.
            //
            // @todo Test if lib works when app has no main launch activity.
            Intent notificationIntent = appMainActivityClass != null ? new Intent(context, appMainActivityClass) : new Intent();
            PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, notificationIntent, 0);

            // Build notification object.
            // NotificationCompat == Notification but ignores channel id when sdkVersion < 26.
            int importance;
            if (Build.VERSION.SDK_INT >= 24) {
                importance = NotificationManager.IMPORTANCE_DEFAULT;
            } else {
                importance = Notification.PRIORITY_DEFAULT;
            }

            // Setting an icon for app is mandatory,
            // cf. https://stackoverflow.com/a/45342820/939741.
            // getApplicationInfo().icon not working because it can
            // provide an adaptative icon and thus make crash the
            // com.android.systemui process.
            // cf. https://github.com/firebase/quickstart-android/issues/382#issuecomment-347926074
            // cf. https://stackoverflow.com/questions/47368187/android-oreo-notification-crashes-system-ui
            // cf. https://issuetracker.google.com/issues/69109923
            // Using setLargeIcon with bitmap doesn't work either.
            // Thus we generate an icon using http://romannurik.github.io/AndroidAssetStudio/icons-notification.html
            // and provide a fallback.
            Resources resources = context.getResources();
            String iconName = context.getString(R.string.phenotype_service_notification_icon);
            int iconId = resources.getIdentifier(iconName, "drawable", context.getPackageName());

            Notification notification = new NotificationCompat.Builder(context, BuildConfig.PHENOTYPE_NOTIFICATION_CHANNEL_ID)
                    .setContentTitle(getText(R.string.phenotype_service_notification_title))
                    .setContentText(getText(R.string.phenotype_service_notification_text))
                    // Set priority (sames as for NotificationChannel).
                    .setPriority(importance)
                    // Set mandatory icon.
                    .setSmallIcon(iconId)
                    // Intent triggered when user clicks on the notification.
                    .setContentIntent(pendingIntent)
                    // Text that summarizes this notification for accessibility
                    // services. As of the L release, this text is no longer shown on
                    // screen, but it is still useful to accessibility services (where
                    // it serves as an audible announcement of the notification's
                    // appearance).
                    // cf. https://developer.android.com/reference/android/app/Notification.html#tickerText
                    .setTicker(getText(R.string.phenotype_service_notification_title))
                    .build();

            // Use notification to promote service as foreground to allow it being
            // started from background (eg. at phone boot) without being killed by
            // android due to background limitations on android 8+. cf.
            // https://developer.android.com/about/versions/oreo/background#services
            startForeground(769538315, notification);

            // Flag the service as started.
            _backgroundState = BackgroundState.started;

            // Clear the onStartFailed callback.
            _onceStartFailedCallback = null;

            // Trigger and clear the callback.
            if (_onceStartedCallback != null) {
                AIDLRunnable onceStartedCallback = _onceStartedCallback;
                _onceStartedCallback = null;
                onceStartedCallback.run();
            }

            // Start the engine.
            this._onBackgroundModeStarted();
        }
        catch (Exception e) {
            // Flag the service as stopped.
            _backgroundState = BackgroundState.stopped;

            // Log exception.
            _log.e("Exception caught at service startup.");
            _log.e("" + e.getMessage()); // @note e.getMessage sometimes return null.

            // Stop the service from background processing. We use stopSelf
            // instead of context stopService because we don't want delayed
            // stop in case of issue. Stopping the service is likely going to
            // make android crashes the process because of the lack of
            // startForeground crash though.
            stopSelf();

            // Rethrow.
            throw e;
        }

        // If the system kills the service after onStartCommand() returns,
        // recreate the service and call onStartCommand(), but do not redeliver
        // the last intent. Instead, the system calls onStartCommand() with a
        // null intent unless there are pending intents to start the service.
        // In that case, those intents are delivered.
        // cf. https://developer.android.com/guide/components/services
        return _restartServiceOnCrash ? START_STICKY : START_NOT_STICKY;
    }

    @Override
    public final void onCreate() {
        super.onCreate();

        _log.t();

        // Log inherited class name in order to easily debug lib gradle
        // configuration from the user.
        _log.i("created: " + this.getClass().getCanonicalName());
    }

    @Override
    public void onDestroy() {
        super.onDestroy();

        _log.t();

        // @warning
        // Be careful, onDestroy might stream called multiple times by android:
        // I had one case where onDestroy was called twice by android.
        // This might have been related to context#startService called twice
        // while app debug was reinstalled in between without stopping the
        // service. I was however unable to reproduce the scenario.

        // @note
        // No need to rely on this to set background state as off as this
        // should be called only at a point service's memory/state will no
        // longer be available anyway.
    }

    @Override
    public void onRebind(Intent intent) {
        super.onRebind(intent);

        _log.t();
    }

    @Override
    public void onLowMemory() {
        super.onLowMemory();

        _log.t();
    }

    @Override
    public void onTrimMemory(int level) {
        super.onTrimMemory(level);

        _log.t();
    }

}
