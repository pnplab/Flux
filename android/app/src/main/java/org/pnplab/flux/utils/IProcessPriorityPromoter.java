package org.pnplab.flux.utils;

public interface IProcessPriorityPromoter {
    void promoteProcessToBackgroundState();
    void unpromoteProcessFromBackgroundState();
}
