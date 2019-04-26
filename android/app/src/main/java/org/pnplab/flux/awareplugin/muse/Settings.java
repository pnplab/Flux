package org.pnplab.flux.awareplugin.muse;


import android.content.SharedPreferences;
import android.os.Bundle;
import android.preference.CheckBoxPreference;
import android.preference.Preference;
import android.preference.PreferenceActivity;
import android.preference.PreferenceManager;

import com.aware.Aware;

public class Settings extends PreferenceActivity implements SharedPreferences.OnSharedPreferenceChangeListener {

    //Plugin settings in XML @xml/preferences
    public static final String STATUS_PLUGIN_EEGMUSE = "status_plugin_eegmuse";

    //Plugin settings UI elements
    private static CheckBoxPreference status;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // @todo Set back this comment if needed ? Requires to add the R.xml.preferences from plugin-template/eegmuse plugin
        // I don't think it's needed as tge STATUS_PLUGIN_EEGMUSE is already set programmatically  & this view should by design only embed activity, not model.
        //addPreferencesFromResource(R.xml.preferences);
        SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(this);
        prefs.registerOnSharedPreferenceChangeListener(this);
    }

    @Override
    protected void onResume() {
        super.onResume();

        status = (CheckBoxPreference) findPreference(STATUS_PLUGIN_EEGMUSE);
        if( Aware.getSetting(this, STATUS_PLUGIN_EEGMUSE).length() == 0 ) {
            Aware.setSetting( this, STATUS_PLUGIN_EEGMUSE, true ); //by default, the setting is true on install
        }
        status.setChecked(Aware.getSetting(getApplicationContext(), STATUS_PLUGIN_EEGMUSE).equals("true"));
    }

    @Override
    public void onSharedPreferenceChanged(SharedPreferences sharedPreferences, String key) {
        Preference setting = findPreference(key);
        if( setting.getKey().equals(STATUS_PLUGIN_EEGMUSE) ) {
            Aware.setSetting(this, key, sharedPreferences.getBoolean(key, false));
            status.setChecked(sharedPreferences.getBoolean(key, false));
        }
        if (Aware.getSetting(this, STATUS_PLUGIN_EEGMUSE).equals("true")) {
            Aware.startPlugin(getApplicationContext(), "org.pnplab.flux.awareplugin.eegmuse");
        } else {
            Aware.stopPlugin(getApplicationContext(), "org.pnplab.flux.awareplugin.eegmuse");
        }
    }
}
