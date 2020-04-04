package org.pnplab.phenotype.synchronization;


import java.util.List;

public abstract class Store {

    public abstract void write(Object data);

    public void writeBatch(List<Object> dataBatch) {
        for (Object data: dataBatch) {
            this.write(data);
        }
    }

}
