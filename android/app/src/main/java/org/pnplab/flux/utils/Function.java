package org.pnplab.flux.utils;

public interface Function {
    void apply();

    // An empty function, to use as a method parameter placeholder when there is actually nothing
    // to do.
    Function noop = () -> {};
}
