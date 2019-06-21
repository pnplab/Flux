# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

-dontnote okhttp3.**
-dontnote okio.**
-dontnote com.facebook.react.**

-keep,includedescriptorclasses class com.BV.LinearGradient.LinearGradientManager { *; }
-keep,includedescriptorclasses class com.ramotion.fluidslider.FluidSlider { *; }
-keep,includedescriptorclasses class com.react.rnspinkit.RNSpinkit { *; }
-keep,includedescriptorclasses class com.brentvatne.exoplayer.ReactExoplayerViewManager { *; }
-keep,includedescriptorclasses class com.github.ybq.android.spinkit.SpinKitView { *; }
-keep,includedescriptorclasses class px.fluidicslider.RNFluidicSlider { *; }
-keep public class com.horcrux.svg.** {*;}

-dontwarn com.google.android.gms.**
-dontwarn okhttp3.internal.platform.* # safe - see https://github.com/square/okhttp/issues/3922

-dontwarn com.aware.plugin.fitbit.ContextCard
-dontwarn com.github.scribejava.apis.service.**
-dontwarn com.github.scribejava.core.services.**

# React-native dev menu (we keep to add aware sync options & stuffs)
-keep class com.facebook.react.devsupport.** { *; }
-dontwarn com.facebook.react.devsupport.**

# Firebase

-keep class io.invertase.firebase.** { *; }
-dontwarn io.invertase.firebase.**

# Muse

-keep class com.choosemuse.libmuse.** { *; }

# Realm

# @note The following is for the js version of realm.
-keep class io.realm.react.util.SSLHelper

# SQLCipher

-keep class net.sqlcipher.** { *; }
-dontwarn net.sqlcipher.**

# @note The following are for the java version of realm.
#
# -keep class io.realm.annotations.RealmModule
# -keep @io.realm.annotations.RealmModule class *
# -keep class io.realm.internal.Keep
# -keep @io.realm.internal.Keep class *
# -dontwarn javax.**
# -dontwarn io.realm.**

# Disabling obfuscation is useful if you collect stack traces from production crashes
# (unless you are using a system that supports de-obfuscate the stack traces).
# -dontobfuscate

# React Native

# Keep our interfaces so they can be used by other ProGuard rules.
# See http://sourceforge.net/p/proguard/bugs/466/
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep,allowobfuscation @interface com.facebook.common.internal.DoNotStrip

# Do not strip any method/class that is annotated with @DoNotStrip
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keep @com.facebook.common.internal.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
    @com.facebook.common.internal.DoNotStrip *;
}

-keepclassmembers @com.facebook.proguard.annotations.KeepGettersAndSetters class * {
  void set*(***);
  *** get*();
}

-keep class * extends com.facebook.react.bridge.JavaScriptModule { *; }
-keep class * extends com.facebook.react.bridge.NativeModule { *; }
-keepclassmembers,includedescriptorclasses class * { native <methods>; }
-keepclassmembers class *  { @com.facebook.react.uimanager.annotations.ReactProp <methods>; }
-keepclassmembers class *  { @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>; }

-dontwarn com.facebook.react.**
-keep,includedescriptorclasses class com.facebook.react.bridge.** { *; }
-keep,includedescriptorclasses class com.facebook.react.cxxbridge.** { *; }

# TextLayoutBuilder uses a non-public Android constructor within StaticLayout.
# See libs/proxy/src/main/java/com/facebook/fbui/textlayoutbuilder/proxy for details.
-dontwarn android.text.StaticLayout

# okhttp

-keepattributes Signature
-keepattributes *Annotation*
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**

# okio

-keep class sun.misc.Unsafe { *; }
-dontwarn java.nio.file.*
-dontwarn org.codehaus.mojo.animal_sniffer.IgnoreJRERequirement
-dontwarn okio.**
