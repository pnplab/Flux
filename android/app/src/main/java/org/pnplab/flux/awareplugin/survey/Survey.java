package org.pnplab.flux.awareplugin.survey;

import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.ContextWrapper;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.ServiceConnection;
import android.os.AsyncTask;
import android.os.IBinder;
import android.util.Log;

import com.aware.Aware;
import com.facebook.react.bridge.ReadableMap;

import java.util.HashMap;
import java.util.Map;

public class Survey {
    private Plugin _plugin;

    // Start aware plugin
    public void start(Context context) {
        Log.v("pnplab.survey::Survey", "#start start org.pnplab.flux.awareplugin.survey");
        Aware.setSetting(context, Settings.STATUS_PLUGIN_SURVEY, true);

        // @warning !!! Aware launches a network request in the super onStartCommand method instead
        //          of using "onHandleIntent" for that. This results in a crash! The network
        //          request is `SSLManager.handleUrl(getApplicationContext(), Aware.getSetting(this, Aware_Preferences.WEBSERVICE_SERVER), true);`
        //          To avoid this crash, study must have been joined first before starting the
        //          plugin! Beware of unpredictable async crashes!
        // @warning I am not too confident this function actually returns if the service is on or
        //          off (it looks like it's actually checking in the db instead). This seems to be
        //          working fine though but might be a false positive due to the delay it adds
        //          before starting the plugin, has the current method is called in parallel with
        //          joinStudy service's start.
        if (Aware.isStudy(context)) {
            // Start plugin.
            Log.v("pnplab.survey::Survey", "#start study already joined - start plugin");
            Aware.startPlugin(context, "org.pnplab.flux.awareplugin.survey");
        }
        else {
            Log.v("pnplab.survey::Survey", "#start study not yet joined - wait for study first!");
            // Start plugin once study has been joined.
            BroadcastReceiver broadcastReceiver = new BroadcastReceiver() {
                @Override
                public void onReceive(Context context, Intent intent) {
                    Log.v("pnplab.survey::Survey", "#start study finally joined - start plugin");

                    // Unregister receiver on first event received ! (listen only once)
                    context.unregisterReceiver(this);
                    // Start plugin.
                    Aware.startPlugin(context, "org.pnplab.flux.awareplugin.survey");
                }
            };
            IntentFilter filter = new IntentFilter();
            filter.addAction(Aware.ACTION_JOINED_STUDY);
            context.registerReceiver(broadcastReceiver, filter);
        }
    }

    // Interface between the aware survey plugin & external code.
    public void bind(Context context) {
        Log.v("pnplab.survey::Survey", "#bind");

        // Retrieve survey plugin instance
        ComponentName componentName;
        componentName = new ComponentName(context.getPackageName(), "org.pnplab.flux.awareplugin.survey.Plugin");
        if (Aware.DEBUG)
            Log.d(Aware.TAG, "Initializing bundled: " + componentName.toString());
        Intent pluginIntent = new Intent();
        pluginIntent.setComponent(componentName);
        context.bindService(pluginIntent, serviceConnectionListener, Context.BIND_AUTO_CREATE);
    }

    protected ServiceConnection serviceConnectionListener = new ServiceConnection() {
        @Override
        public void onServiceConnected(ComponentName name, IBinder binder) {
            Log.v("pnplab.survey::Survey", "#onServiceConnected");
            org.pnplab.flux.awareplugin.survey.Plugin.LocalBinder castedBinder = (org.pnplab.flux.awareplugin.survey.Plugin.LocalBinder) binder;
            _plugin = castedBinder.getService();
        }

        @Override
        public void onServiceDisconnected(ComponentName name) {
            Log.v("pnplab.survey::Survey", "#onServiceDisconnected");
        }
    };

    public void addSurveyData(long timestamp, ReadableMap content) {
        Log.v("pnplab.survey::Survey", "#addSurveyData");

        Map<String, Object> processingContent = content.toHashMap();
        Map<String, Double> parsedContent = new HashMap<String, Double>();
        for (String key : processingContent.keySet()) {
            parsedContent.put(key, (Double) processingContent.get(key));
        }

        _plugin.storeSurvey(timestamp, parsedContent);
    }

}
