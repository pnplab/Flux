package org.pnplab.flux.awarecore;

import android.content.ContentProvider;
import android.content.Context;
import android.content.pm.ProviderInfo;
import android.os.Build;
import android.os.Environment;
import android.os.Looper;
import android.util.Log;

import androidx.test.core.app.ApplicationProvider;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.rule.ServiceTestRule;

import com.aware.Aware;
import com.aware.Aware_Preferences;
import com.aware.providers.Aware_Provider;

import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.pnplab.flux.BuildConfig;
import org.pnplab.flux.TestApplication;
import org.pnplab.flux.shadows.AwareShadow;
import org.pnplab.flux.shadows.SQLiteClosableShadow;
import org.pnplab.flux.shadows.SQLiteDatabaseShadow;
import org.robolectric.Robolectric;
import org.robolectric.android.controller.ContentProviderController;
import org.robolectric.annotation.Config;
import org.robolectric.annotation.LooperMode;
import org.robolectric.shadows.ShadowContentResolver;
import org.robolectric.shadows.ShadowEnvironment;
import org.robolectric.shadows.ShadowLog;
import org.robolectric.shadows.ShadowLooper;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.robolectric.Shadows.shadowOf;

@RunWith(AndroidJUnit4.class)
@LooperMode(LooperMode.Mode.PAUSED)
@Config(
    sdk = Build.VERSION_CODES.O_MR1,
    application = TestApplication.class,
    shadows = {
        SQLiteClosableShadow.class,
        SQLiteDatabaseShadow.class,
        AwareShadow.class
    },
    instrumentedPackages = { "net.sqlcipher.database", "com.aware" }
)
public class TestJoinStudy {

    @Rule
    public final ServiceTestRule serviceRule = new ServiceTestRule();


    // @note see `https://github.com/robolectric/robolectric/blob/master/robolectric/src/test/java/org/robolectric/shadows/ShadowServiceTest.java`
    // for robolectric service's shadow doc (mock).

    // @warning Not possible to test directly aware services as sqlcipher is not compatible with robolectric! https://discuss.zetetic.net/t/how-to-hide-or-exclude-sqlcipher-from-robolectric/1782/3

    @Before
    public void setUp() throws Exception {
        Context context = ApplicationProvider.getApplicationContext();

        // Forward log to console!
        ShadowLog.stream = System.out;

        // In order to run, aware require primary external storage to be currently mounted!
        ShadowEnvironment.setExternalStorageState(Environment.MEDIA_MOUNTED);
        assertEquals(Environment.getExternalStorageState(), Environment.MEDIA_MOUNTED);

        // Setup correct provider for settings so they can be registered.
        // @note Required to allow aware to store settings and get them back. If not done
        //       no error will be thrown, storage will appear successful but will be ignored due to
        //       robolectric shadow of ContentProvider.
        //
        // throws java.lang.RuntimeException: error instantiating android.content.ContentProvider
        ContentProviderController<Aware_Provider> contentProviderCtrl = Robolectric.buildContentProvider(Aware_Provider.class);
        contentProviderCtrl.create("org.pnplab.flux.provider.aware");
        Aware_Provider contentProvider = contentProviderCtrl.get();

        // Enable verbose aware log entries.
        Aware.DEBUG = true;
        Aware.setSetting(context, Aware_Preferences.DEBUG_FLAG, "true");

        // Specify device id.
        // @note This is required to avoid server sending back "I don't know who you are." result on
        //       study config fetch when joining study.
        String deviceId = "UNIT_TEST";
        Aware.setSetting(context, Aware_Preferences.DEVICE_ID, deviceId);

        Log.i("tag", "- setup");
    }

    @After
    public void tearDown() throws Exception {
        Log.i("tag", "- teardown");
    }

    @Test
    public void shouldStartAware() throws Exception {
        Context context = ApplicationProvider.getApplicationContext();

        // Given aware is not yet started.
        assertFalse(AwareMock.IS_CORE_RUNNING);

        // When we start aware service.
        AwareMock.mock.startAwareSync(context);

        // Then, aware should be running.
        assertTrue(AwareMock.IS_CORE_RUNNING);

        // @warning Battery optimisation and accessibility commands are not tested...

        // Then, stop aware.
        AwareMock.mock.stopAwareSync(context);
    }

    @Test(timeout=10000) // await 10 sec max in case of study join!
    public void shouldJoinStudy() throws Exception {
        Context context = ApplicationProvider.getApplicationContext();

        // Given aware is not yet started.
        assertFalse(AwareMock.IS_CORE_RUNNING);

        // When we start aware service.
        AwareMock.mock.startAwareSync(context);

        // Then, aware should be running.
        assertTrue(AwareMock.IS_CORE_RUNNING);

        // When we join study.
        // on android studio emulator: use default proxy http://10.0.2.2:8888/index.php/webservice/index/1/4JZdBnj0YOHJ
        // on robolectric: http://127.0.0.1:8888/index.php/webservice/index/1/4JZdBnj0YOHJ
        // on phone: use ngrok to build up proxy or use localhost and forward phone's port to computer using adb.
        AwareMock.mock.joinStudySync(context, "http://127.0.0.1:8888/index.php/webservice/index/1/4JZdBnj0YOHJ");

        // Then, study should be joined!
        // ...if study is not joined, this test will stuck !

        // Execute all tasks posted to main looper. -- Espacially study
        shadowOf(Looper.getMainLooper()).idle();

        shadowOf(Looper.getMainLooper()).runToEndOfTasks();
        shadowOf(Looper.getMainLooper()).runToEndOfTasks();
        shadowOf(Looper.getMainLooper()).runToEndOfTasks();
        shadowOf(Looper.getMainLooper()).runToEndOfTasks();
        shadowOf(Looper.getMainLooper()).runToEndOfTasks();
        shadowOf(Looper.getMainLooper()).runToEndOfTasks();

        // ... Synch
        ShadowLooper.runUiThreadTasks();

        // Then, stop aware.
        AwareMock.mock.stopAwareSync(context);;
    }
}
