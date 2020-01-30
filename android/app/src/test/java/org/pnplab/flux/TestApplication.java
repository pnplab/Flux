package org.pnplab.flux;

import android.app.Application;
import android.os.Build;
import android.util.Log;

import com.choosemuse.libmuse.MuseManagerAndroid;
import com.facebook.react.ReactApplication;
import com.bugsnag.BugsnagReactNative;
import com.rnfs.RNFSPackage;
import com.airbnb.android.react.lottie.LottiePackage;
import io.invertase.firebase.RNFirebasePackage;
import io.invertase.firebase.messaging.RNFirebaseMessagingPackage;
import com.brentvatne.react.ReactVideoPackage;
import com.BV.LinearGradient.LinearGradientPackage;
import com.facebook.react.PackageList;
import com.facebook.react.ReactNativeHost;

import org.pnplab.flux.utils.PermissionManager;
import org.pnplab.flux.utils.ProcessPriorityPromoter;

import java.util.Arrays;
import java.util.List;

public class TestApplication extends Application implements ReactApplication {

    private PermissionManager permissionManager;
    private ProcessPriorityPromoter processPriorityPromoter;

    private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
            // @note always display dev menu
            // return true || BuildConfig.DEBUG;
            return BuildConfig.DEBUG;
        }

        @Override
        protected List<com.facebook.react.ReactPackage> getPackages() {
            List<com.facebook.react.ReactPackage> packages = new PackageList(this).getPackages();
            packages.add(new org.pnplab.flux.surveytask.ReactPackage());
            packages.add(new org.pnplab.flux.aware.ReactPackage());

            packages.add(new RNFSPackage());
            packages.add(new LottiePackage());
            packages.add(new RNFirebasePackage());
            packages.add(new RNFirebaseMessagingPackage());
            packages.add(new ReactVideoPackage());
            packages.add(new LinearGradientPackage());

            packages.removeIf(pkg -> pkg.getClass().isInstance(BugsnagReactNative.getPackage().getClass()));

            // MuseManagerPackage is only compatible with ARM v7 devices. Avoid launch-time errors
            // on android emulator (which is x86 on osx) by adding it conditionally.
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
                Log.e("Flux", "MUSE compatibility error: Android version < LOLLIPOP " + Build.VERSION.SDK_INT);
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

                        // Add pkg.
                        org.pnplab.flux.restingstatetask.ReactPackage pkg =
                                new org.pnplab.flux
                                        .restingstatetask
                                        .ReactPackage(
                                            permissionManager,
                                            processPriorityPromoter
                                        );

                        packages.add(pkg);
                    }
                    catch (UnsatisfiedLinkError e) {
                        Log.e("Flux", "Couldn't link muse even if linking appears to be supported!.");
                    }
                }
            }

            return packages;
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

        // BugsnagReactNative.start(this);
        permissionManager = new PermissionManager(this);
        processPriorityPromoter = new ProcessPriorityPromoter(this);

        // SoLoader.initialize(this, /* native exopackage */ false);

        String arch = System.getProperty("os.arch");
        Log.i("Flux", "Current arch: " + arch);
    }
}
