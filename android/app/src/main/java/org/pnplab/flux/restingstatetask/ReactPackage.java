package org.pnplab.flux.restingstatetask;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import org.jetbrains.annotations.NotNull;
import org.pnplab.flux.utils.IProcessPriorityPromoter;
import org.pnplab.flux.utils.PermissionManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class ReactPackage implements com.facebook.react.ReactPackage {

    private final PermissionManager _permissionManager;
    private final IProcessPriorityPromoter _backgroundStatePromoter;

    public ReactPackage(PermissionManager permissionManager, IProcessPriorityPromoter backgroundStatePromoter) {
        _permissionManager = permissionManager;
        _backgroundStatePromoter = backgroundStatePromoter;
    }

    @NotNull
    @Override
    public List<NativeModule> createNativeModules(@NotNull ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();

        modules.add(new ReactModule(reactContext, _permissionManager, _backgroundStatePromoter));

        return modules;
    }

    @NotNull
    @Override
    public List<ViewManager> createViewManagers(@NotNull ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }

}
