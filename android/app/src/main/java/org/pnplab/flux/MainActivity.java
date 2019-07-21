package org.pnplab.flux;

import com.facebook.react.ReactActivity;

import org.pnplab.flux.utils.IPermissionManager;
import org.pnplab.flux.utils.IPermissionManager.IPermissionManagerForwarder;
import org.pnplab.flux.utils.IPermissionManager.PermissionManagerForwarderHelper;

public class MainActivity extends ReactActivity implements IPermissionManagerForwarder {

    private PermissionManagerForwarderHelper permissionManagerForwarderHelper = new PermissionManagerForwarderHelper();

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "Flux";
    }

    @Override
    public void startListenerForwarding(IPermissionManager pm) {
        // This method will be called automatically on this Activity lifecycle start event through
        // application's ActivityLifecycleCallbacks mechanism inside PermissionManager.
        permissionManagerForwarderHelper.startListenerForwarding(pm);
    }

    @Override
    public void stopListenerForwarding(IPermissionManager pm) {
        // This method will be called automatically on this Activity lifecycle stop event through
        // application's ActivityLifecycleCallbacks mechanism inside PermissionManager.
        permissionManagerForwarderHelper.stopListenerForwarding(pm);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        // Forward call to parent class.
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        
        // Forward call to permission manager.
        permissionManagerForwarderHelper.onRequestPermissionsResult(requestCode, permissions, grantResults);
    }
}
