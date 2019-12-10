/*
 * @flow
 */

import React from 'react';
import { View } from 'react-native';

import styled from 'styled-components';

import {
    R3Container,
    R3Header,
    R3Content,
    R3Footer,
    Title,
    Text,
    TextButton
} from '../../crossplatform-theme';

type Permission = {
    +name: string,
    +title: string,
    +description: string
};
type Props = {
    +list: Array<Permission>,
    +displayPermission: (Permission) => boolean,
    +displayDescription: (Permission) => boolean,
    +highlightPermissionTitle: (Permission) => boolean,
    +isPermissionGranted: (Permission) => boolean,
    +onRequestPermission: () => any
};

const RequestPermissionsView = ({
    list,
    displayPermission,
    displayDescription,
    highlightPermissionTitle,
    isPermissionGranted,
    onRequestPermission
}: Props) =>
    <R3Container accessibilityLabel="requestpermissions">
        <R3Header>
            <Title>Autorisations</Title>
        </R3Header>
        <R3Content>
            {
                list
                    .filter(p => displayPermission(p))
                    .map((perm, idx) =>
                        <React.Fragment key={perm.name}>
                            <Text>
                                {perm.title}
                            </Text>
                            <Text>
                                {perm.description}
                            </Text>
                        </React.Fragment>
                    )
            }
        </R3Content>
        <R3Footer>
            {
                onRequestPermission &&
                /* @warning accessibilityLabel of both Submit & Request button have to get the same name or
                    integration testing doesn't work for some reason (didn't investigate).
                    @warning the above comment/rule is broken - should check if appium tests still works. */
                <TextButton icon="ok" color="blue" onPress={onRequestPermission} accessibilityLabel="requestpermissions-request" />
            }
        </R3Footer>
    </R3Container>;

export default RequestPermissionsView;
