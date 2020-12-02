package org.pnplab.phenotype.rabbitmq;

import androidx.annotation.NonNull;

public class RabbitCredentials {
    public final @NonNull String userId;
    public final @NonNull String password;

    public RabbitCredentials(@NonNull String userId, @NonNull String password) {
        this.userId = userId;
        this.password = password;
    }
}
