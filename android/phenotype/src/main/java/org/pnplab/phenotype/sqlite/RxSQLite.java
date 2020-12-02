package org.pnplab.phenotype.sqlite;

import android.content.Context;

import androidx.annotation.NonNull;

import io.reactivex.rxjava3.core.Single;
import io.reactivex.rxjava3.core.SingleTransformer;


// both output async stream + lazy creation.
public class RxSQLite {

    public static @NonNull
    Single<SQLiteDatabase> DatabasePipe(@NonNull SQLiteModel sqliteModel, @NonNull Context context) {
        @NonNull Single<SQLiteDatabase> single = Single
            .create(
                emitter -> {
                    SQLiteDatabase sqLiteDatabase = new SQLiteDatabase(sqliteModel, context);
                    emitter.onSuccess(sqLiteDatabase);
                }
            );

        return single;
    }

    // @todo RefCountPipe

    public static @NonNull
    SingleTransformer<SQLiteDatabase, SQLiteAdapter> AdapterPipe(@NonNull SQLiteModel sqliteModel) {
        return upstream ->
            upstream
                .map(sqliteDatabase ->
                    new SQLiteAdapter(sqliteDatabase, sqliteModel)
                );
    }

}
