package org.pnplab.stressoncovid19;

import android.content.Context;
import android.content.SharedPreferences;

import org.pnplab.phenotype.rabbitmq.RabbitCredentials;

import io.reactivex.rxjava3.core.Observable;


// @warning not thread safe due to SharedPreference usage!
public class UserDataManager {

    private final SharedPreferences _sharedPreferences;

    public UserDataManager(SharedPreferences sharedPreferences) {
        this._sharedPreferences = sharedPreferences;
    }

    // Helper to retrieve dependencies required to instantiate this class.
    public static SharedPreferences getSharedPreferencesFromContext(Context context) {
        // @note SharedPreference deprecated from API 29+, thus we use androidx
        // PreferenceManager instead.
        // @warning SharedPreferences is not thread safe!
        SharedPreferences sharedPreferences = context.getSharedPreferences("phenotype", Context.MODE_PRIVATE);
        return sharedPreferences;
    }

    public boolean hasRabbitMQCredentials() {
        return _sharedPreferences.contains("userId");
    }

    public void generateRabbitMQCredentials() {
        SharedPreferences.Editor sharedPrefEditor = _sharedPreferences.edit();
        sharedPrefEditor.putString("userId", "111111"); // @todo configure value
        sharedPrefEditor.putString("userPassword", "111111"); // @todo configure value
        boolean didCommitUpdate = sharedPrefEditor.commit();
        if (!didCommitUpdate) {
            throw new IllegalStateException("userId specified value wasn't committed for some reason");
        }
    }

    public RabbitCredentials getRabbitMQCredentials() {
        // Retrieve userId and password.
        String userId = _sharedPreferences.getString("userId", null);
        assert userId != null;
        String userPassword = _sharedPreferences.getString("userPassword", null);
        assert userPassword != null;

        // will inject change later on.
        RabbitCredentials credentials = new RabbitCredentials(userId, userPassword);
        return credentials;
    }

    public Observable<RabbitCredentials> streamRabbitMQCredentials() {
        // will be able to change later on.
        RabbitCredentials credentials = this.getRabbitMQCredentials();
        Observable<RabbitCredentials> rabbitCredentialStream = Observable.just(credentials);
        return rabbitCredentialStream;
    }
}
