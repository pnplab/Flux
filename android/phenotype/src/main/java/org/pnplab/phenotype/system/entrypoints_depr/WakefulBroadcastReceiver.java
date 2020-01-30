package org.pnplab.phenotype.system.entrypoints_depr;

/**
 * @warning
 * As of Android O, background check restrictions make this class no longer
 * generally useful. (It is generally not safe to start a service from the
 * receipt of a broadcast, because you don't have any guarantees that your app
 * is in the foreground at this point and thus allowed to do so.) Instead,
 * developers should use android.app.job.JobScheduler to schedule a job, and
 * this does not require that the app hold a wake lock while doing so (the
 * system will take care of holding a wake lock for the job).
 * cf. https://developer.android.com/reference/androidx/legacy/content/WakefulBroadcastReceiver.html
 *
 * battery optimisation bypass could make this work though.
 * https://medium.com/til-kotlin/jobintentservice-for-background-processing-on-android-o-39535460e060
 *
 * @note
 * jobservice is not an advised solution for sensing (since it's a continuous
 * task), although we perhaps could use it in an hacky indefinite way, see
 * how long system allow it before kill, and restart automatically as kill
 * would be considered a failure.
 *
 * Also, Android's WorkManager is even better suited than JobService (for
 * compatibility).
 * The WorkManager API makes it easy to schedule deferrable, asynchronous tasks
 * that are expected to run even if the app exits or device restarts.
 * cf. https://developer.android.com/topic/libraries/architecture/workmanager.
 *
 * Note: The minimum repeat interval that can be defined is 15 minutes (same as the JobScheduler API).
 * cf. https://developer.android.com/topic/libraries/architecture/workmanager/how-to/recurring-work
 *
 * @note
 * Also, should be triggered by wakeup sensor ?
 * https://source.android.com/devices/sensors/suspend-mode
 *
 * @note
 * Check "how to pick up android background api's" graph:
 * cf. https://developer.android.com/guide/background/
 */
public class WakefulBroadcastReceiver {

}
