package org.pnplab.flux.notification;


import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import android.preference.PreferenceManager;

import androidx.test.core.app.ApplicationProvider;
import androidx.test.ext.junit.runners.AndroidJUnit4;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.pnplab.flux.TestApplication;
import org.robolectric.annotation.Config;

import static com.google.common.truth.Truth.assertThat;

@RunWith(AndroidJUnit4.class)
@Config(
    sdk = Build.VERSION_CODES.O_MR1,
    application = TestApplication.class
)
public class EntrypointMediatorSpec {
    private SharedPreferences sharedPreferences;
    private SharedPreferences.Editor sharedPreferencesEditor;

    /**
     * Robolectric v4 doc is very lightweight and thus don't provide any
     * information about how to use robolectric to design our notification
     * tests. However, robolectric's own unit tests are well written! We thus
     * use them as our documentation source. Check
     * ShadowSharedPreferences.java: `https://github.com/robolectric/robolectric/blob/master/robolectric/src/test/java/org/robolectric/shadows/ShadowSharedPreferencesTest.java`
     */
    @Before
    public void beforeEach() {
        Context context = ApplicationProvider.getApplicationContext();

        // Setup Shared Preferences.
        // sharedPreferences = context.getSharedPreferences("mypref-file", Context.MODE_PRIVATE); -- for specific-file preferences.
        sharedPreferences = PreferenceManager.getDefaultSharedPreferences(context);
        // Ensure no shared preferences have leaked from previous tests.
        assertThat(sharedPreferences.getAll()).hasSize(0);
        sharedPreferencesEditor = sharedPreferences.edit();
    }

    @Test
    public void it_Should_Store_Set_Alarms_Across_Components_And_Reboots() {
//        // Given
//
//        // When the user stores a notification
//
//        // The notification should be shared across components and reboots
//        editor.commit();
//
//        // Retrieve shared preferences.
//        Context context = ApplicationProvider.getApplicationContext();
//        SharedPreferences anotherSharedPreferences = PreferenceManager.getDefaultSharedPreferences(context);
//
//        // Make sure data are registered.
//        assertTrue(anotherSharedPreferences.getBoolean("boolean", false));
//        assertThat(anotherSharedPreferences.getFloat("float", 666f)).isEqualTo(1.1f);
//        assertThat(anotherSharedPreferences.getInt("int", 666)).isEqualTo(2);
//        assertThat(anotherSharedPreferences.getLong("long", 666L)).isEqualTo(3L);
//        assertThat(anotherSharedPreferences.getString("string", "wacka wa")).isEqualTo("foobar");
//        assertThat(anotherSharedPreferences.getStringSet("stringSet", null)).isEqualTo(stringSet);

    }

    @Test
    public void it_Should_Update_Shared_Alarms_Across_Components_And_Reboots() {

    }

    @Test
    public void it_Should_Retrieve_Shared_Alarms_Setup_Across_Components_And_Reboots() {

    }
}
