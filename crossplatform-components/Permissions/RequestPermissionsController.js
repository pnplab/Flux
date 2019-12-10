/*
 * @flow
 *
 * @pre
 * This screen should only be shown if app has not been authorized yet !
 *
 * @description
 * Setup screen. User set a password that sets up & activates the study.
 */

import React, { PureComponent } from 'react';
import { PermissionsAndroid } from 'react-native';

import RequestPermissionsView from './RequestPermissionsView';

// Configure types.
type Props = {
    +onStepFinished: () => void
};
type State = {
    +currentPermissionName: 'write-external-storage'
        | 'access-fine-location'
        // @note not required as access-fine-location injects
        //     access-coarse-location. cf.
        //     https://developers.google.com/maps/documentation/android-sdk/location
        // | 'access-coarse-location'
        // Call history
        | 'read-call-log'
        // Current cellular network information, the status of any ongoing
        // calls and network signal strength.
        // @note not required as read-call-log injects as read-phone-state.
        //    however, android recommand to still ask permission independently
        //    due to breaking change between android version. cf.
        //    https://developer.android.com/guide/topics/permissions/overview#perm-groups
        //    We could check by-android-version in the source code here:
        //    https://github.com/aosp-mirror/platform_frameworks_base/blob/master/core/res/AndroidManifest.xml
        | 'read-phone-state'
        // Sms history.
        | 'read-sms'
        // req. to read data sync settings from outside SyncAdapter.
        // cf. https://stackoverflow.com/questions/28087032/android-get-application-account-outside-syncadapter-handle-sync-options
        // parts of android.permission-group.CONTACTS
        // cf. https://stackoverflow.com/a/32784499/939741
        | 'get-accounts',
    +grantedPermissionNames: Array<string>
};

// Configure component logic.
// @todo refactor this mess
//     - move everything text related to view.
//     - remove flexible list logic w/ policy (too generic, no longer useful as
//       we display perms one by one).
export default class RequestPermissionsController extends PureComponent<Props, State> {

    // Set displayName for debug and bugreport navigation tracing.
    static displayName = 'RequestPermissions';

    /* eslint-disable quotes */
    permissions = [
        {
            name: 'write-external-storage',
            title: 'Fichiers du smartphone.',
            description:
                `Nous utilisons cette permission pour sauvegarder les données
                collectées sur votre cellulaire jusqu'à leur synchronisation.`.replace(/\s{4,}/g, ' '),
            permission: PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        },
        {
            name: 'access-fine-location',
            title: 'Système de localisation.',
            description:
                `Nous utilisons cette permission pour collecter tout type
                d'information relative à votre position (GPS et de réseau).`.replace(/\s{4,}/g, ' '),
            permission: PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        },
        {
            name: 'read-call-log',
            title: 'Historique des appels.',
            description:
                `Nous utilisons cette permission pour enregistrer l'historique
                de vos appels téléphoniques. Le contenu de vos appels et les
                informations de vos correspondants ne sont pas enregistrés.`.replace(/\s{4,}/g, ' '),
            permission: PermissionsAndroid.PERMISSIONS.READ_CALL_LOG
        },
        {
            name: 'read-phone-state',
            title: 'État du cellulaire.',
            description:
                `Nous utilisons cette permission pour accéder aux paramètre
                de votre réseau cellulaire.`.replace(/\s{4,}/g, ' '),
            permission: PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE
        },
        {
            name: 'read-sms',
            title: 'Historique des sms.',
            description:
                `Nous utilisons cette permission pour enregistrer l'historique
                de vos sms. Le contenu de vos messages et les informations de
                vos correspondants ne sont pas enregistrés.`.replace(/\s{4,}/g, ' '),
            permission: PermissionsAndroid.PERMISSIONS.READ_SMS
        },
        {
            name: 'get-accounts',
            title: 'Système d\'autorisation.',
            description:
                `Nous utilisons cette permission pour accéder à la
                configuration du système de synchronisation des données de
                notre application.`.replace(/\s{4,}/g, ' '),
            permission: PermissionsAndroid.PERMISSIONS.GET_ACCOUNTS
        }
    ];
    /* eslint-enable quotes */

    // List permission names for ulterior motive.
    permissionNames: Array<$PropertyType<State, 'currentPermissionName'>> = this
        .permissions
        .map(p => p.name);

    // Only show permissions up to the currently processed one.
    // displayPermission = (p, idx) =>
    //     idx <= this.permissionNames.indexOf(this.state.currentPermissionName);
    // displayPermission = (p, idx) =>
    //     this.state.grantedPermissionNames.indexOf(p.name) === -1;
    displayPermission = (p) => p.name === this.state.currentPermissionName;

    // Only show the description of the currently processed permission.
    displayDescription = (p) =>
        p.name === this.state.currentPermissionName;

    // Highlight the perms that have been set & the current one.
    highlightPermTitle = (p) =>
        this.permissions.indexOf(p) <= this.permissionNames.indexOf(this.state.currentPermissionName);

    constructor(props: Props) {
        super(props);

        this.state = {
            currentPermissionName: this
                .permissions[0]
                .name,
            grantedPermissionNames: []
        };
    }

    async componentDidMount() {
        // Populate allowed permission list.
        const newGrantedPermissionNames =
            (await Promise.all(
                this
                    .permissions
                    .map(async p => [p.name, await PermissionsAndroid.check(p.permission)])
            ))
            .filter(([a, b]) => b === true)
            .map(([a, b]) => a);

        // Check all permissions have already been granted.
        if (this._haveAllPermissionBeenGranted(newGrantedPermissionNames)) {
            // Directly trigger next step in this case!
            this.props.onStepFinished();
        }
        // If there is still permission to grant.
        else {
            // Set current permission to the first unallowed one.
            const newCurrentPermissionName = this._getNextPermissionToGrant(newGrantedPermissionNames);

            // Update component state.
            this.setState({
                grantedPermissionNames: newGrantedPermissionNames,
                currentPermissionName: newCurrentPermissionName
            });
        }
    }

    isPermissionGranted = (perm) =>
        this.state.grantedPermissionNames.indexOf(perm.name) !== -1;

    _haveAllPermissionBeenGranted = (grantedPermissionNames: Array<string>): boolean => {
        let haveAllPermissionBeenGranted = this
            .permissions
            .filter(p => !grantedPermissionNames.includes(p.name))
            .map(p => p.name)
            .length === 0;
        return haveAllPermissionBeenGranted;
    }

    _getNextPermissionToGrant = (grantedPermissionNames: Array<string>): $PropertyType<State, 'currentPermissionName'> => {
        if (this._haveAllPermissionBeenGranted(grantedPermissionNames)) {
            throw new Error('trying to get nex permission to grant while every permission have been granted');
        }

        let newCurrentPermissionName = this
            .permissions
            .filter(p => !grantedPermissionNames.includes(p.name))
            .map(p => p.name)[0];

        return newCurrentPermissionName;
    }

    // Request current perm when the user pushes on the submit button! Triggers
    // onStepFinished automatically once all have been granted.
    onRequestPermission = async () => {
        const currentPermissionName = this.state.currentPermissionName;

        const currentPerm = this
            .permissions
            .filter(p => p.name === currentPermissionName)
            .map(p => p.permission)
            [0];

        const requestResult = await PermissionsAndroid.request(currentPerm);

        switch (requestResult) {
        case PermissionsAndroid.RESULTS.GRANTED:
        {
            // Check if all permissions have been granted.
            let newGrantedPermissionNames = [currentPermissionName, ...this.state.grantedPermissionNames];
            let haveAllPermissionBeenGranted = this._haveAllPermissionBeenGranted(newGrantedPermissionNames);

            // Trigger on step finished once all permission have been granted.
            if (haveAllPermissionBeenGranted) {
                this.props.onStepFinished();
            }
            // Display next permission to be granted otherwise.
            else {
                this.setState(s => {
                    // Add newly granted permission to the granted list.
                    let newGrantedPermissionNames = [currentPermissionName, ...s.grantedPermissionNames];

                    // Set current permission to the first unallowed one.
                    let newCurrentPermissionName = this._getNextPermissionToGrant(newGrantedPermissionNames);

                    return {
                        ...s,
                        grantedPermissionNames: newGrantedPermissionNames,
                        currentPermissionName: newCurrentPermissionName
                    };
                });
            }
            break;
        }
        case PermissionsAndroid.RESULTS.DENIED:
            // do nothing... The user can just click back on the button.
            break;
        case PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN:
            // uhh.. ?
            // @todo Ask for manual update!
            break;
        }
    }

    render() {
        return (
            <RequestPermissionsView
                list={this.permissions}
                displayPermission={this.displayPermission}
                displayDescription={this.displayDescription}
                highlightPermTitle={this.highlightPermTitle}
                isPermissionGranted={this.isPermissionGranted}
                onRequestPermission={this.state.currentPermissionName && this.onRequestPermission}
            />
        );
    }

}
