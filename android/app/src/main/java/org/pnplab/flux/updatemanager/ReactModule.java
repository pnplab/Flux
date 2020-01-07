package org.pnplab.flux.updatemanager;

import android.annotation.SuppressLint;
import android.content.ContextWrapper;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

import androidx.core.content.FileProvider;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.google.android.gms.common.GoogleApiAvailability;
import com.google.android.gms.common.GooglePlayServicesNotAvailableException;
import com.google.android.gms.common.GooglePlayServicesRepairableException;
import com.google.android.gms.security.ProviderInstaller;

import org.jetbrains.annotations.NotNull;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.InputStream;
import java.security.MessageDigest;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.HashMap;
import java.util.Map;

/**
 * Copied from https://github.com/mikehardy/react-native-update-apk.
 * We've removed some methods and added ones to check whether install from
 * unknown source permission is granted or not.
 *
 * Apk download is done through react-native-filesystem (RNFS) module.
 *
 * @warning requires specific manifest settings (see the original source doc
 * for more info).
 *
 * @todo homogenize coding style.
 **/
public class ReactModule extends ReactContextBaseJavaModule {

    public ReactModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NotNull
    @Override
    public String getName() {
        return "SoftwareUpdateManager";
    }

    @SuppressLint("PackageManagerGetSignatures")
    @Override
    public Map<String, Object> getConstants() {
        ContextWrapper context = getReactApplicationContext();

        final Map<String, Object> constants = new HashMap<>();
        PackageManager pManager = context.getPackageManager();
        PackageInfo pInfo;
        try {
            pInfo = pManager.getPackageInfo(context.getPackageName(), PackageManager.GET_SIGNATURES);
            constants.put("versionName", pInfo.versionName);
            constants.put("versionCode", pInfo.versionCode);
            constants.put("packageName", pInfo.packageName);
            constants.put("firstInstallTime", pInfo.firstInstallTime);
            constants.put("lastUpdateTime", pInfo.lastUpdateTime);
            constants.put("packageInstaller", pManager.getInstallerPackageName(pInfo.packageName));
            constants.put("signatures", getPackageSignatureInfo(pInfo));
        } catch (PackageManager.NameNotFoundException e) {
            e.printStackTrace();
        }

        return constants;
    }

    /**
     * `isInstallFromUnknownSourceEnabled` method is used to know whether a
     * permission request dialog for unknown installation source will be asked
     * or not. We use this method to display additional indication to the user.
     * We could use it to suggest to revoke the settings once the update has
     * occured as well.
     *
     * @requires targetSdkVersion >= 26 in order for canRequestPackageInstalls to
     * be available.
     * @requires minSdkVersion >= 3 in order for install non market apps
     * setting to be available.
     * @returns boolean (in promise)
     **/
    @SuppressLint("ObsoleteSdkInt")
    @ReactMethod
    public void isInstallFromUnknownSourceEnabled(Promise p) {
        ContextWrapper context = getReactApplicationContext();

        // If API >= 26 (android O), use appropriate method. Android O+ uses
        // app-specific authorisation for unknown-source apk installation.
        boolean isInstallFromUnknownSourceEnabled = false;
        if (Build.VERSION.SDK_INT >= 26) {
            // @warning requires appropriate permissions and target sdk version
            //     otherwise always returns false.
            PackageManager packageManager = context.getPackageManager();
            isInstallFromUnknownSourceEnabled = packageManager.canRequestPackageInstalls();
        }
        // Otherwise, canRequestPackageInstalls can't be used. If API >= API 3,
        // we rely to the android global setting for unknown-source apk
        // installation.
        else if (Build.VERSION.SDK_INT >= 3) {
            // @warning Android doc states `Settings.Globals.INSTALL_NON_MARKET_APPS`
            //     is deprecated since API 21 in favor for `Settings.Secure.INSTALL_NON_MARKET_APPS`,
            //     which is deprecated since API 17. Thus there is a mismatch
            //     in doc since the oldest deprecation is the recommanded one.
            //     We suspect deprecation recommendation to have change back
            //     and forth multiple time thus the misleading doc. There is no
            //     indication for better alternative method for android api
            //     version 17 to 26 anyway. `.Secure` call works since SDK 3
            //     while `.Globals` since SDK 17 (android 4.4.2 Jelly Beans),
            //     which doesn't change much for us since we require greater
            //     android minSdkVersion anyway.
            isInstallFromUnknownSourceEnabled = Settings.Secure.getInt(null, Settings.Secure.INSTALL_NON_MARKET_APPS, 0) == 1;
        }
        // Reject the call if android api version < 3 (not possible in our case
        // as we have superior android minSdkVersion requirement, and very old
        // android version).
        else {
            p.reject("Unsupported android version for isInstallFromUnknownSourceEnabled");
            return;
        }

        // Return the result.
        p.resolve(isInstallFromUnknownSourceEnabled);
    }

    @ReactMethod
    public void getApkInfo(String apkPath, Promise p) {
        ContextWrapper context = getReactApplicationContext();

        try {
            PackageManager pManager = context.getPackageManager();
            PackageInfo pInfo = pManager.getPackageArchiveInfo(apkPath, PackageManager.GET_SIGNATURES);
            WritableMap apkInfo = Arguments.createMap();
            apkInfo.putString("versionName", pInfo.versionName);
            apkInfo.putInt("versionCode", pInfo.versionCode);
            apkInfo.putString("packageName", pInfo.packageName);
            apkInfo.putString("packageInstaller", pManager.getInstallerPackageName(pInfo.packageName));
            apkInfo.putArray("signatures", getPackageSignatureInfo(pInfo));
            p.resolve(apkInfo);
        } catch (Exception e) {
            p.reject(e);
        }
    }

    @ReactMethod
    public void installApk(String filePath, String fileProviderAuthority) {
        ContextWrapper context = getReactApplicationContext();

        File file = new File(filePath);
        if (!file.exists()) {
            Log.e("Flux", "installApk: file does not exist '" + filePath + "'");
            // FIXME this should take a promise and fail it
            return;
        }

        if (Build.VERSION.SDK_INT >= 24) {
            // API24 and up has a package installer that can handle FileProvider content:// URIs
            Uri contentUri;
            try {
                contentUri = FileProvider.getUriForFile(getReactApplicationContext(), fileProviderAuthority, file);
            } catch (Exception e) {
                // FIXME should be a Promise.reject really
                Log.e("Flux", "installApk exception with authority name '" + fileProviderAuthority + "'", e);
                throw e;
            }
            Intent installApp = new Intent(Intent.ACTION_INSTALL_PACKAGE);
            installApp.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            installApp.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            installApp.setData(contentUri);
            installApp.putExtra(Intent.EXTRA_INSTALLER_PACKAGE_NAME, context.getApplicationInfo().packageName);
            context.startActivity(installApp);
        } else {
            // Old APIs do not handle content:// URIs, so use an old file:// style
            String cmd = "chmod 777 " + file;
            try {
                Runtime.getRuntime().exec(cmd);
            } catch (Exception e) {
                e.printStackTrace();
            }
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            intent.setDataAndType(Uri.parse("file://" + file), "application/vnd.android.package-archive");
            context.startActivity(intent);
        }
    }

    @ReactMethod
    public void patchSSLProvider(boolean force, boolean dialogIfRepairable, Promise p) {
        ContextWrapper context = getReactApplicationContext();

        // This is unnecessary for Android API20+, skip unless forced
        if (!force && Build.VERSION.SDK_INT > 20) {
            p.resolve(true);
            return;
        }

        try {
            ProviderInstaller.installIfNeeded(context);
            p.resolve(true);
        } catch (GooglePlayServicesRepairableException e) {
            // Thrown when Google Play Services is not installed, up-to-date, or enabled
            // Show dialog to allow users to install, update, or otherwise enable Google Play services.
            if (dialogIfRepairable) {
                GoogleApiAvailability.getInstance().getErrorDialog(getCurrentActivity(), e.getConnectionStatusCode(), 0);
            }
            String message = "Google Play Services repairable but not usable right now";
            Log.e("SecurityException", message);
            p.reject(new Throwable(message));
        } catch (GooglePlayServicesNotAvailableException e) {
            String message = "Google Play Services not available";
            Log.e("SecurityException", message);
            p.reject(new Throwable(message));
        }
    }

    private WritableArray getPackageSignatureInfo(PackageInfo pInfo) {
        WritableArray signaturesReturn = Arguments.createArray();
        final Signature[] arrSignatures = pInfo.signatures;
        for (Signature sig : arrSignatures) {
            final byte[] rawCert = sig.toByteArray();
            WritableMap signatureReturn = Arguments.createMap();

            InputStream certStream = new ByteArrayInputStream(rawCert);
            try {
                CertificateFactory certFactory = CertificateFactory.getInstance("X509");
                X509Certificate x509Cert = (X509Certificate) certFactory.generateCertificate(certStream);
                signatureReturn.putString("subject", x509Cert.getSubjectDN().toString());
                signatureReturn.putString("issuer", x509Cert.getIssuerDN().toString());
                signatureReturn.putString("serialNumber", x509Cert.getSerialNumber().toString());
                signatureReturn.putInt("signature", sig.hashCode());
                signatureReturn.putString("toString", x509Cert.toString());
                signatureReturn.putString("thumbprint", getThumbprint(x509Cert));
            } catch (Exception e) {
                e.printStackTrace();
            }
            signaturesReturn.pushMap(signatureReturn);
        }
        return signaturesReturn;
    }

    private static String getThumbprint(X509Certificate cert) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] der = cert.getEncoded();
        md.update(der);
        byte[] bytes = md.digest();
        StringBuilder sb = new StringBuilder(2 * bytes.length);
        for (byte b : bytes) {
            sb.append("0123456789ABCDEF".charAt((b & 0xF0) >> 4));
            sb.append("0123456789ABCDEF".charAt((b & 0x0F)));
        }
        String hex = sb.toString();
        return hex.toLowerCase();
    }
}