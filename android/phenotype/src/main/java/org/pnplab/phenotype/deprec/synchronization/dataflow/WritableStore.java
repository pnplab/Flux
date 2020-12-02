package org.pnplab.phenotype.deprec.synchronization.dataflow;


import java.util.List;

public interface WritableStore {

    void write(Object data);

    default void writeBatch(List<Object> dataBatch) {
        for (Object data: dataBatch) {
            this.write(data);
        }
    }

}
