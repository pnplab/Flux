package org.pnplab.flux.restingstatetask.model;

import com.choosemuse.libmuse.Muse;

import org.pnplab.flux.utils.FunctionIn1;

import java.util.ArrayList;
import java.util.List;

public class MuseDeviceListObserverMock implements IMuseDeviceListObserver {

    private List<Muse> _muses = new ArrayList<>();
    private FunctionIn1<List<Muse>> _onDeviceListChanged;

    public class MockHelper {
        public void fillDeviceList() {
            _muses.clear();
            _muses.add(new MuseMock());
            _muses.add(new MuseMock());
            if (_onDeviceListChanged != null) {
                _onDeviceListChanged.apply(_muses);
            }
        }

        public boolean isListening() {
            return _onDeviceListChanged != null;
        }

        public void clearDeviceList() {
            _muses.clear();
        }
    }
    public MockHelper mock = new MockHelper();

    @Override
    public void listenDeviceListChange(FunctionIn1<List<Muse>> onDeviceListChanged) {
        _onDeviceListChanged = onDeviceListChanged;
    }

    @Override
    public void unlistenDeviceListChange() {
        _onDeviceListChanged = null;
    }

    @Override
    public boolean isEmpty() {
        return _muses.size() == 0;
    }

    @Override
    public Muse getFirstDevice() {
        return _muses.get(0);
    }

}
