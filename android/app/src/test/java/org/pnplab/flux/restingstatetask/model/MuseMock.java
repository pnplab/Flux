package org.pnplab.flux.restingstatetask.model;

import com.choosemuse.libmuse.ConnectionState;
import com.choosemuse.libmuse.Muse;
import com.choosemuse.libmuse.MuseConfiguration;
import com.choosemuse.libmuse.MuseConnectionListener;
import com.choosemuse.libmuse.MuseDataListener;
import com.choosemuse.libmuse.MuseDataPacketType;
import com.choosemuse.libmuse.MuseErrorListener;
import com.choosemuse.libmuse.MusePreset;
import com.choosemuse.libmuse.MuseVersion;
import com.choosemuse.libmuse.NotchFrequency;

public class MuseMock extends Muse {

    @Override
    public void connect() {

    }

    @Override
    public void disconnect() {

    }

    @Override
    public void execute() {

    }

    @Override
    public void runAsynchronously() {

    }

    @Override
    public ConnectionState getConnectionState() {
        return null;
    }

    @Override
    public String getMacAddress() {
        return null;
    }

    @Override
    public String getName() {
        return null;
    }

    @Override
    public double getRssi() {
        return 0;
    }

    @Override
    public double getLastDiscoveredTime() {
        return 0;
    }

    @Override
    public void setNumConnectTries(int i) {

    }

    @Override
    public MuseConfiguration getMuseConfiguration() {
        return null;
    }

    @Override
    public MuseVersion getMuseVersion() {
        return MuseVersion.makeDefaultVersion();
    }

    @Override
    public void registerConnectionListener(MuseConnectionListener museConnectionListener) {

    }

    @Override
    public void unregisterConnectionListener(MuseConnectionListener museConnectionListener) {

    }

    @Override
    public void registerDataListener(MuseDataListener museDataListener, MuseDataPacketType museDataPacketType) {

    }

    @Override
    public void unregisterDataListener(MuseDataListener museDataListener, MuseDataPacketType museDataPacketType) {

    }

    @Override
    public void registerErrorListener(MuseErrorListener museErrorListener) {

    }

    @Override
    public void unregisterErrorListener(MuseErrorListener museErrorListener) {

    }

    @Override
    public void unregisterAllListeners() {

    }

    @Override
    public void setPreset(MusePreset musePreset) {

    }

    @Override
    public void enableDataTransmission(boolean b) {

    }

    @Override
    public void setNotchFrequency(NotchFrequency notchFrequency) {

    }

    @Override
    public boolean isLowEnergy() {
        return true;
    }

    @Override
    public boolean isPaired() {
        return false;
    }

    @Override
    public void enableException(boolean b) {

    }
}
