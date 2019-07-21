package org.pnplab.flux.notifications;

import androidx.test.uiautomator.UiDevice;

public class FluxOnboardingPOM {
    private final UiDevice device;
    private final long timeout;

    FluxOnboardingPOM(UiDevice device, long timeout) {
        this.device = device;
        this.timeout = timeout;
    }
}
