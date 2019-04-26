package org.pnplab.flux.awareplugin.survey;

import android.content.ComponentName;
import android.content.Context;
import android.content.ContextWrapper;
import android.content.Intent;
import android.content.ServiceConnection;
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
        Log.i("AwareModule", "start org.pnplab.flux.awareplugin.survey");
        Aware.setSetting(context, Settings.STATUS_PLUGIN_SURVEY, true);
        Aware.startPlugin(context, "org.pnplab.flux.awareplugin.survey");
    }

    // Interface between the aware survey plugin & external code.
    public void bind(ContextWrapper context) {
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
            Log.d("AwareModule", "onServiceConnected/survey");
            org.pnplab.flux.awareplugin.survey.Plugin.LocalBinder castedBinder = (org.pnplab.flux.awareplugin.survey.Plugin.LocalBinder) binder;
            _plugin = castedBinder.getService();
        }

        @Override
        public void onServiceDisconnected(ComponentName name) {
            Log.d("AwareModule", "onServiceDisconnected/survey");
        }
    };

    public void addSurveyData(long timestamp, ReadableMap content) {
        Map<String, Object> processingContent = content.toHashMap();
        Map<String, Double> parsedContent = new HashMap<String, Double>();
        for (String key : processingContent.keySet()) {
            parsedContent.put(key, (Double) processingContent.get(key));
        }

        _plugin.storeSurvey(timestamp, parsedContent);
    }
}
