package org.pnplab.flux;

import android.app.Application;
import android.content.Context;
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
import com.facebook.react.ReactPackage;
import com.facebook.soloader.SoLoader;

import org.pnplab.flux.utils.ProcessPriorityPromoter;
import org.pnplab.flux.utils.PermissionManager;

import java.lang.reflect.InvocationTargetException;
import java.util.Arrays;
import java.util.List;

// @warning Both Aware and Muse API have no error handling mechanism!
// Therefore it is sometimes not possible to know when something fails.
// The Muse API will log an exception (without rethrowing it), be especially watchful about reading
// logged exception containing the tag `Binder` as they likely come from the C++ binder part of
// muse API. Thus, *the only way to know an error has happened is to watch for Logcat*. The API
// errors are sometimes logged with warning tag instead of Error.
// Same goes with the Aware API! On Aware, it's sometimes just not possible to know if an error has
// happened.
public class MainApplication extends Application implements ReactApplication {

    private PermissionManager permissionManager;
    private ProcessPriorityPromoter processPriorityPromoter;

    @Override
    public void onCreate() {
        super.onCreate();

        permissionManager = new PermissionManager(this);
        processPriorityPromoter = new ProcessPriorityPromoter(this);

        BugsnagReactNative.start(this);

        SoLoader.init(this, /* native exopackage */ false);
        initializeFlipper(this);

        String arch = System.getProperty("os.arch");
        Log.i("Flux", "Current arch: " + arch);
    }

    /**
     * Loads Flipper (Facebook mobile app debugger).
     *
     * @param context
     */
    private static void initializeFlipper(Context context) {
        if (BuildConfig.DEBUG) {
            try {
                /*
                 * We use reflection here to pick up the class that initializes
                 * Flipper, since Flipper library is not available in release
                 * mode.
                 */
                Class<?> aClass = Class.forName("com.facebook.flipper.ReactNativeFlipper");
                aClass.getMethod("initializeFlipper", Context.class).invoke(null, context);
            } catch (ClassNotFoundException e) {
                e.printStackTrace();
            } catch (NoSuchMethodException e) {
                e.printStackTrace();
            } catch (IllegalAccessException e) {
                e.printStackTrace();
            } catch (InvocationTargetException e) {
                e.printStackTrace();
            }
        }
    }

    private final ReactNativeHost mReactNativeHost =
        new ReactNativeHost(this) {
            @Override
            public boolean getUseDeveloperSupport() {
                // @note always display dev menu
                // return true || BuildConfig.DEBUG;
                return BuildConfig.DEBUG;
            }

            @Override
            protected List<ReactPackage> getPackages() {
                // List<ReactPackage> list = new ArrayList<>(Arrays.asList(
                //     new MainReactPackage(),
                //     BugsnagReactNative.getPackage(),
                //     new RNSentryPackage(),
                //     new RNFSPackage(),
                //     new RNAppUpdatePackage(),
                //     new RNDevMenuPackage(),
                //     new LottiePackage(),
                //     new RNFirebasePackage(),
                //     new RNFirebaseMessagingPackage(),
                //     new SvgPackage(),
                //     new RNDeviceInfo(),
                //     new ReactVideoPackage(),
                //     new AwareManagerPackage(),
                //     new RNFluidicSliderPackage(),
                //     new VectorIconsPackage(),
                //     new RealmReactPackage(),
                //     new LinearGradientPackage()
                // ));

                @SuppressWarnings("UnnecessaryLocalVariable")
                List<ReactPackage> packages = new PackageList(this).getPackages();
                // packages.add(new RNSentryPackage());
                packages.add(new RNFSPackage());
                // packages.add(new RNAppUpdatePackage());
                // packages.add(new RNDevMenuPackage());
                packages.add(new LottiePackage());
                packages.add(new RNFirebasePackage());
                packages.add(new RNFirebaseMessagingPackage());
                // packages.add(new SvgPackage());
                // packages.add(new RNDeviceInfo());
                packages.add(new ReactVideoPackage());
                packages.add(new AwareManagerPackage());
                // packages.add(new RNFluidicSliderPackage());
                // packages.add(new VectorIconsPackage());
                // packages.add(new RealmReactPackage());
                packages.add(new LinearGradientPackage());

                // Packages that cannot be autolinked yet can be added manually here, for example:
                // packages.add(new MyReactNativePackage());

                //return packages;

                // Muse is only compatible with ARM v7 devices. We avoid launch-time errors on android
                // emulator (which is x86 on osx) by adding the related android module conditionally.
                if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.LOLLIPOP) {
                    Log.e("Flux", "Android version incompatible with muse < LOLLIPOP " + android.os.Build.VERSION.SDK_INT);
                }
                else {
                    // @note List -> SUPPORTED_ABIS `https://developer.android.com/ndk/guides/abis`
                    String[] archs = new String[0];
                    archs = Build.SUPPORTED_ABIS;
                    Log.d("Flux", Arrays.toString(archs));
                    if (!Arrays.asList(archs).contains("armeabi-v7a")) {
                        Log.e("Flux", "Hardware architecture incompatible with muse. armeabi-v7a is not supported.");
                    }
                    else {
                        Log.i("Flux", "Muse appears to be compatible.");

                        // Ensure muse linking is working! Indeed, armeabi-v7a ABI appears on android-x86_64 but linking still fails.
                        // This may simply be a build configuration issue we can resolve (ie. the muse .so isn't packaged inside the
                        // react-native x86_64 apk).
                        try {
                            MuseManagerAndroid.getInstance();
                            packages.add(new org.pnplab.flux.restingstatetask.ReactPackage(permissionManager, processPriorityPromoter));
                            // list.add(new MuseManagerPackage());
                            // packages.add(new MuseManagerPackage());
                        }
                        catch (UnsatisfiedLinkError e) {
                            Log.e("Flux", "Muse lib seems to appears to be supported, however linking has failed.");
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

}
