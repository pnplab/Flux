package org.pnplab.flux;

import android.app.Application;
import android.content.Context;
import android.os.Build;
import android.util.Log;

import com.bugsnag.android.Configuration;
import com.choosemuse.libmuse.MuseManagerAndroid;
import com.facebook.react.ReactApplication;
import com.ocetnik.timer.BackgroundTimerPackage;
import com.bugsnag.BugsnagReactNative;
import com.rnfs.RNFSPackage;
import com.airbnb.android.react.lottie.LottiePackage;
import io.invertase.firebase.RNFirebasePackage;
import io.invertase.firebase.messaging.RNFirebaseMessagingPackage;
import io.invertase.firebase.notifications.RNFirebaseNotificationsPackage;

import com.brentvatne.react.ReactVideoPackage;
import com.BV.LinearGradient.LinearGradientPackage;
import com.facebook.react.PackageList;
import com.facebook.react.ReactNativeHost;
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

        // Log android API version.
        int androidApiVersion = android.os.Build.VERSION.SDK_INT;
        Log.i("Flux", "System android API version is " + androidApiVersion);

        // Log android hardware architecture.
        String arch = System.getProperty("os.arch");
        Log.i("Flux", "System architecture is " + arch);


        // Set bugsnag enhanced native bug reporting on top of react-native one
        // and detext anr.
        // cf. https://docs.bugsnag.com/platforms/react-native/react-native/enhanced-native-integration/
        // To set up java config, do not set config in manifest file but in java
        // bugsnag init code cf. https://github.com/bugsnag/bugsnag-react-native/issues/376#issuecomment-513222395
        // To upload jave stacktraces, set the manifest api key value anyway and
        // use bugsnag gradle plugin.
        // cf. https://github.com/bugsnag/bugsnag-react-native/issues/376#issuecomment-514568602
        Configuration config = new Configuration(BuildConfig.BUGSNAG_API_KEY);
        config.setDetectAnrs(true);
        config.setDetectNdkCrashes(true);
        config.setSendThreads(true);
        config.setEnableExceptionHandler(true);
        config.setProjectPackages(new String[]{"org,pnplab.flux", "com.aware"});
        BugsnagReactNative.startWithConfiguration(this, config);

        SoLoader.init(this, /* native exopackage */ false);
        initializeFlipper(this);
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
            protected List<com.facebook.react.ReactPackage> getPackages() {
                @SuppressWarnings("UnnecessaryLocalVariable")
                List<com.facebook.react.ReactPackage> packages = new PackageList(this).getPackages();

                // Auto linking is not implemented for our own packages.
                packages.add(new org.pnplab.flux.surveytask.ReactPackage());
                packages.add(new org.pnplab.flux.aware.ReactPackage());

                // Auto linking seems not to be implemented for these
                // dependencies.
                addPackageIfNotAutoLinked(packages, RNFSPackage.class);
                addPackageIfNotAutoLinked(packages, LottiePackage.class);
                addPackageIfNotAutoLinked(packages, LinearGradientPackage.class);
                addPackageIfNotAutoLinked(packages, ReactVideoPackage.class);

                // RNFirebase auto linking implementation had been troublesome
                // and changed between version. We thus check if autolinking is
                // implemented and provide our own linking if not. We'll be
                // able to remove this once the ecosystem is a bit more stable.
                // Currently it is implemented for the RNFirebasePackage class
                // alone.
                addPackageIfNotAutoLinked(packages, RNFirebasePackage.class);
                addPackageIfNotAutoLinked(packages, RNFirebaseNotificationsPackage.class);
                addPackageIfNotAutoLinked(packages, RNFirebaseMessagingPackage.class);

                // Autolink seems to work for these:
                // packages.add(new RNSentryPackage());
                // packages.add(new RNAppUpdatePackage());
                // packages.add(new RNDevMenuPackage());
                // packages.add(new SvgPackage());
                // packages.add(new RNDeviceInfo());

                // Muse is only compatible with ARM v7 devices. We avoid
                // launch-time errors on android emulator (which is x86 on osx)
                // by adding the related android module conditionally.
                if (!isMuseCompatibleWithAndroidVersion()) {
                    Log.e("Flux", "Muse API is incompatible with the android version. " + Build.VERSION.SDK_INT + " < LOLLIPOP");
                }
                else if (!isMuseCompatibleWithHardware()) {
                    Log.e("Flux", "Muse API is incompatible with the hardware architecture.");
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) { // for Build.SUPPORTED_ABIS
                        String supportedArchs = Arrays.toString(Build.SUPPORTED_ABIS);
                        Log.e("Flux", "armeabi-v7a is not in " + supportedArchs);
                    }
                }
                else {
                    Log.i("Flux", "Muse API seems to be compatible with the current system.");
                    // Try/catch block ensures muse linking is working! Indeed,
                    // armeabi-v7a ABI appears on android-x86_64 but linking
                    // still fails. This may simply be a build configuration
                    // issue we can resolve (ie. the muse .so isn't packaged
                    // inside the react-native x86_64 apk). Or something else.
                    try {
                        // Force-link muse.
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
                        Log.e("Flux", "Muse API linking has failed.");
                        e.printStackTrace();
                    }
                }

                return packages;
            }

            @Override
            protected String getJSMainModuleName() {
                return "index";
            }
        };

    private boolean isMuseCompatibleWithAndroidVersion() {
        // Not sure this is true. Official doc is deprecated. We relied on this
        // source: https://images-na.ssl-images-amazon.com/images/I/816-85ZeU-S.pdf
        return Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT;
    }

    private boolean isMuseCompatibleWithHardware() {
        // Check current ABI is arm.
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
            return Build.CPU_ABI.equals("armeabi-v7a");
        }
        // Check version is Lollipop in order to be able to use
        // `Build.SUPPORTED_ABIS`.
        else {
            // @note List -> SUPPORTED_ABIS `https://developer.android.com/ndk/guides/abis`
            String[] archs = Build.SUPPORTED_ABIS;
            boolean supportsArm7 = Arrays
                .asList(archs)
                .contains("armeabi-v7a");

            return supportsArm7;
        }
    }

    private <T extends com.facebook.react.ReactPackage> void addPackageIfNotAutoLinked(List<com.facebook.react.ReactPackage> packages, Class<T> addedPackageClass) {
        // Check if the package has been auto linked.
        boolean hasPackage = false;
        for (Object pkgItem: packages) {
            if (addedPackageClass.isInstance(pkgItem)) {
                hasPackage = true;
                break;
            }
        }

        // If the package has been auto linked, notify the developer he can
        // remove it.
        if (hasPackage) {
            Log.d("Flux", "Autolinking is implemented for " + addedPackageClass.getName() + ". Manual link is obsolete.");
        }
        // If not, add the package.
        else {
            try {
                packages.add(addedPackageClass.newInstance());
            } catch (IllegalAccessException | InstantiationException e) {
                Log.e("Flux", "Package " + addedPackageClass.getName() + " instantiation error.");
                e.printStackTrace();
            }
        }
    }


    @Override
    public ReactNativeHost getReactNativeHost() {
      return mReactNativeHost;
    }

}
