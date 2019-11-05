/*
 * @flow
 */

import React from 'react';
import { View, Text } from 'react-native';

import styled from 'styled-components';

import { Container, Content, Title, Button, Form, Item, Label, Input, CircleButton, R3Container, R3Header, R3Content, R3Footer, CheckList, CLItem, CLIHeader, CLIHStatus, CLIHTitle, CLIContent } from '../../crossplatform-theme';

type Perm = {| +name: string, +title: string, +description: string |};
type Props = {
    +list: Array<Perm>,
    +current: 'write-external-storage' 
        | 'get-accounts' 
        | 'access-fine-location' 
        | 'access-coarse-location' 
        | 'read-phone-state' 
        | 'read-call-log' 
        | 'read-sms',
    +displayPerm: (Perm) => boolean,
    +displayDescr: (Perm) => boolean,
    +highlightPermTitle: (Perm) => boolean,
    +isPermissionGranted: (Perm) => boolean,
    +onRequestPermission: () => void,
    +onSubmit: () => void
};

const CheckPermissionsView = ({ list, displayPerm, displayDescr, highlightPermTitle, isPermissionGranted, onRequestPermission, onSubmit }: Props) => 
    <Container accessibilityLabel="checkpermissions">
        <R3Container>
            <R3Header>
                <Title>Gestion des Permissions</Title>
            </R3Header>
            <R3Content>
                <CheckList>
                    {
                        list
                            .filter(displayPerm)
                            .map((perm, idx) => 
                                <CLItem key={perm.name}>
                                    <CLIHeader>
                                        <CLIHStatus style={{color: isPermissionGranted(perm) ? '#999' : '#444'}}>
                                            {
                                                isPermissionGranted(perm)
                                                && 'v'
                                                || '-'
                                            }
                                        </CLIHStatus>
                                        <CLIHTitle style={{
                                            fontWeight: highlightPermTitle(perm) ? 'bold' : undefined,
                                            color: isPermissionGranted(perm) ? '#999' : '#444'
                                        }}>
                                            {perm.title}
                                        </CLIHTitle>
                                    </CLIHeader>
                                    {displayDescr(perm) &&
                                        <CLIContent>
                                            {perm.description}
                                        </CLIContent>
                                    }
                                </CLItem>
                            )
                    }
                </CheckList>
            </R3Content>
            <R3Footer>
                {
                    onRequestPermission &&
                    /* @warning accessibilityLabel of both Submit & Request button have to get the same name or
                       integration testing doesn't work for some reason (didn't investigate). 
                       @warning the above comment/rule is broken - should check if appium tests still works. */
                    <CircleButton type="validate" color="blue" onPress={onRequestPermission} accessibilityLabel="checkpermissions-request" />
                }
                {
                    onSubmit &&
                    <CircleButton type="next" color="green" onPress={onSubmit} accessibilityLabel="checkpermissions-next" />
                }
            </R3Footer>
        </R3Container>
    </Container>;

export default CheckPermissionsView;