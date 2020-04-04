package org.pnplab.phenotype.synchronization;

import com.rabbitmq.client.Channel;

public class RabbitStore extends Store {

    private final Channel channel;

    public RabbitStore(Channel channel) {
        super();

        this.channel = channel;
    }

    @Override
    public void write(Object data) {

    }

}
