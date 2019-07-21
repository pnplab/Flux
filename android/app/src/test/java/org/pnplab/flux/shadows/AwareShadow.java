package org.pnplab.flux.shadows;

import android.content.Context;

import com.aware.Aware;

import org.robolectric.annotation.Implementation;
import org.robolectric.annotation.Implements;
import org.robolectric.shadows.ShadowService;

import java.util.HashMap;
import java.util.Map;

// We need to implement a shadow of Aware class as it is for the most part a static class in java
// sense. It can't simply be mocked for static methods as inheritance doesn't work with static
// methods.
@Implements(Aware.class)
public class AwareShadow extends ShadowService {

    public static Map<String, String> settings = new HashMap<>();

    public AwareShadow() { }

    @Implementation
    protected static void setSetting(Context context, String key, Object value) {
        if (settings == null) {
            settings = new HashMap<>();
        }
        settings.put(key, value.toString());
    }

    @Implementation
    protected static String getSetting(Context context, String key) {
        if (settings == null) {
            settings = new HashMap<>();
        }
        String result = settings.get(key);
        return result != null ? result : "";
    }

}
