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

import CheckPermissionsView from './CheckPermissionsView';

// Configure types.
type Props = {
    +onStepFinished: () => void
};
type State = {
    +currentPermissionName: 'write-external-storage'
        | 'get-accounts'
        | 'access-fine-location'
        | 'access-coarse-location'
        | 'read-phone-state'
        | 'read-call-log'
        | 'read-sms',
    +grantedPermissionNames: Array<string>
};

// Configure component logic.
export default class CheckPermissionsController extends PureComponent<Props, State> {

    // Set displayName for debug and bugreport navigation tracing.
    static displayName = 'CheckPermissions';

    /* eslint-disable quotes */
    permissions = [
        {
            name: 'write-external-storage',
            title: 'Accès au système de fichier du smartphone.',
            description:
                `Nous utilisons cette permission pour temporairement stocker
                les données sur votre smartphone jusqu'à ce qu'elles soient
                envoyées sur le serveur. Nous n'accédons pas aux autres
                données enregistrées sur votre smartphone (photo, notes,
                ...).`.replace(/\s{4,}/g, ' '),
            permission: PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        },
        {
            name: 'get-accounts',
            title: 'Accès au système de connexion',
            description:
                `get-accounts`.replace(/\s{4,}/g, ' '),
            permission: PermissionsAndroid.PERMISSIONS.GET_ACCOUNTS
        },
        {
            name: 'access-fine-location',
            title: 'Accès au GPS 1',
            description:
                `access-fine-location`.replace(/\s{4,}/g, ' '),
            permission: PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        },
        {
            name: 'access-coarse-location',
            title: 'Accès au GPS 2',
            description:
                `access-coarse-location`.replace(/\s{4,}/g, ' '),
            permission: PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
        },
        {
            name: 'read-phone-state',
            title: 'Accès à l\'état réseau du téléphone',
            description:
                `read-phone-state`.replace(/\s{4,}/g, ' '),
            permission: PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE
        },
        {
            name: 'read-call-log',
            title: 'Accès à l\'historique des appels',
            description:
                `read-call-log`.replace(/\s{4,}/g, ' '),
            permission: PermissionsAndroid.PERMISSIONS.READ_CALL_LOG
        },
        {
            name: 'read-sms',
            title: 'Accès à l\'historique des sms',
            description:
                `read-sms`.replace(/\s{4,}/g, ' '),
            permission: PermissionsAndroid.PERMISSIONS.READ_SMS
        }
    ];
    /* eslint-enable quotes */

    // List permission names for ulterior motive.
    permissionNames = this
        .permissions
        .map(p => p.name);

    // Only show permissions up to the currently processed one.
    // displayPerm = (p, idx) =>
    //     idx <= this.permissionNames.indexOf(this.state.currentPermissionName);
    // displayPerm = (p, idx) =>
    //     this.state.grantedPermissionNames.indexOf(p.name) === -1;
    displayPerm = () => true;

    // Only show the description of the currently processed permission.
    displayPermDescr = (p) =>
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
        try {
            // Update allowed permission list.
            const newGrantedPermissionNames =
                (await Promise.all(
                    this
                        .permissions
                        .map(async p => [p.name, await PermissionsAndroid.check(p.permission)])
                ))
                .filter(([a, b]) => b === true)
                .map(([a, b]) => a);


            // Set current permission to the first unallowed one.
            const newCurrentPermissionName = this
                .permissions
                .filter(p => !newGrantedPermissionNames.includes(p.name))
                .map(p => p.name)
                [0];

            this.setState({
                grantedPermissionNames: newGrantedPermissionNames,
                currentPermissionName: newCurrentPermissionName
            });
        }
        catch (err) {
            // @todo show message!
            throw err;
        }
    }

    isPermissionGranted = (perm) =>
        this.state.grantedPermissionNames.indexOf(perm.name) !== -1;

    // Request current perm when the user pushes on the submit button!
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
            this.setState(s => {
                // Add newly granted permission to the granted list.
                const newGrantedPermissionNames = [currentPermissionName, ...s.grantedPermissionNames];

                // Set current permission to the first unallowed one.
                const newCurrentPermissionName = this
                    .permissions
                    .filter(p => !newGrantedPermissionNames.includes(p.name))
                    .map(p => p.name)
                    [0];

                return {
                    ...s,
                    grantedPermissionNames: newGrantedPermissionNames,
                    currentPermissionName: newCurrentPermissionName
                };
            });
            break;
        case PermissionsAndroid.RESULTS.DENIED:
            // do nothing...
            break;
        case PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN:
            // uhh.. ?
            // @todo Ask for manual update!
            break;
        }

        // Set next permission
    }

    // Go to next step when the user pushes the submit button!
    onSubmit = () => {
        this.props.onStepFinished();
    }

    render() {
        return (
            <CheckPermissionsView
                list={this.permissions}
                displayPerm={this.displayPerm}
                displayDescr={this.displayPermDescr}
                highlightPermTitle={this.highlightPermTitle}
                isPermissionGranted={this.isPermissionGranted}
                onRequestPermission={this.state.currentPermissionName && this.onRequestPermission}
                onSubmit={!this.state.currentPermissionName && this.onSubmit}
            />
        );
    }

}
