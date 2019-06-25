
    listenAwareDataSync = () => {
        // Listen to aware data sync events & adds updates to sourced events array accordingly.
        this._unlistenAwareDataSync = listenSyncEvents({
            onSyncStarted: (evt) => 
                this.setState(prevState => ({
                    awareDataSyncEvents: prevState.awareDataSyncEvents.concat([{
                        type: 'SyncStarted',
                        ...evt
                    }])
                })),
            onSyncBatchStarted: (evt) => 
                this.setState(prevState => ({
                    awareDataSyncEvents: prevState.awareDataSyncEvents.concat([{
                        type: 'SyncBatchStarted',
                        ...evt
                    }])
                })),
            onSyncFinished: (evt) => 
                this.setState(prevState => ({
                    awareDataSyncEvents: prevState.awareDataSyncEvents.concat([{
                        type: 'SyncFinished',
                        ...evt
                    }])
                })),
            onSyncFailed: (evt) => 
                this.setState(prevState => ({
                    awareDataSyncEvents: prevState.awareDataSyncEvents.concat([{
                        type: 'SyncFailed',
                        ...evt
                    }])
                })),
        });
    }
    unlistenAwareDataSync = () => {
        // Stop listening to aware data sync events.
        if (this._unlistenAwareDataSync) {
            this._unlistenAwareDataSync();
        }
    }

            // Unlisten aware data sync. Probably useless since the method is
        // already called manually before component unmount.
        if (this._unlistenAwareDataSync) {
            this._unlistenAwareDataSync();
        }
