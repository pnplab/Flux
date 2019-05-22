package org.pnplab.flux;

import android.app.Application;
import android.content.ComponentName;
import android.content.Intent;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Handler;
import android.util.Log;

import com.aware.Aware;
import com.aware.utils.SSLManager;
import com.choosemuse.libmuse.MuseManagerAndroid;
import com.facebook.react.ReactApplication;
import com.rnfs.RNFSPackage;
import com.parryworld.rnappupdate.RNAppUpdatePackage;
import com.zoontek.rndevmenu.RNDevMenuPackage;
import com.airbnb.android.react.lottie.LottiePackage;
import io.invertase.firebase.RNFirebasePackage;
import io.invertase.firebase.messaging.RNFirebaseMessagingPackage;
import com.horcrux.svg.SvgPackage;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import com.brentvatne.react.ReactVideoPackage;
import px.fluidicslider.RNFluidicSliderPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import io.realm.react.RealmReactPackage;
import com.BV.LinearGradient.LinearGradientPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

    private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
            // @note always display dev menu
            return true || BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
            List<ReactPackage> list = new ArrayList<>(Arrays.asList(
                new MainReactPackage(),
                new RNFSPackage(),
                new RNAppUpdatePackage(),
                new RNDevMenuPackage(),
                new LottiePackage(),
                new RNFirebasePackage(),
                new RNFirebaseMessagingPackage(),
                new SvgPackage(),
                new RNDeviceInfo(),
                new ReactVideoPackage(),
                new AwareManagerPackage(),
                new RNFluidicSliderPackage(),
                new VectorIconsPackage(),
                new RealmReactPackage(),
                new LinearGradientPackage()
            ));

            // MuseManagerPackage is only compatible with ARM v7 devices. Avoid launch-time errors
            // on android emulator (which is x86 on osx) by adding it conditionally.
            if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.LOLLIPOP) {
                Log.e("Flux", "MUSE compatibility error: Android version < LOLLIPOP " + android.os.Build.VERSION.SDK_INT);
            }
            else {
                // @note List -> SUPPORTED_ABIS `https://developer.android.com/ndk/guides/abis`
                String[] archs = new String[0];
                archs = Build.SUPPORTED_ABIS;
                Log.d("Flux", Arrays.toString(archs));
                if (!Arrays.asList(archs).contains("armeabi-v7a")) {
                    Log.e("Flux", "MUSE compatibility error: 'armeabi-v7a' is not supported.");
                }
                else {
                    Log.i("Flux", "Checking MUSE compatibility: MUSE appears to be compatible.");

                    // Ensure muse linking is working! Indeed, armeabi-v7a ABI appears on android-x86_64 but linking still fails.
                    // This may simply be a build configuration issue we can resolve (ie. the muse .so isn't packaged inside the
                    // react-native x86_64 apk).
                    try {
                        MuseManagerAndroid.getInstance();
                        list.add(new MuseManagerPackage());
                    }
                    catch (UnsatisfiedLinkError e) {
                        Log.e("Flux", "Couldn't link muse even if linking appears to be supported!.");
                    }
                }
            }

            return list;
        }

        @Override
        protected String getJSMainModuleName() {
            return "index";
        }
    };

    @Override
    public ReactNativeHost getReactNativeHost() {
      return mReactNativeHost;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        SoLoader.init(this, /* native exopackage */ false);

        String arch = System.getProperty("os.arch");
        Log.i("Flux", "Current arch: " + arch);
    }
}
