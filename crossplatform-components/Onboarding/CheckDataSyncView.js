/*
 * @flow
 */

import React from 'react';
import { View, Text, ScrollView } from 'react-native';

import styled from 'styled-components';

import { Container, Content, Title, Button, Form, Item, Label, Input, CircleButton, R3Container, R3Header, R3Content, R3Footer, CheckList, CLItem, CLIHeader, CLIHcurrentStep, CLIHTitle, CLIContent } from '../../crossplatform-theme';

type Props = {
    +syncStatus: {
        [table]: {
            +status: 'SYNC_ONGOING' | 'SYNC_DONE' | 'SYNC_ERROR',
            rowCount?: number,
            lastRowUploaded?: number,
            error?: number 
        }
    },
    +currentStep: 'TEXT' | 'SYNC_ONGOING' | 'SYNC_DONE' | 'SYNC_ERROR',
    +onSyncData: () => void,
    +onSubmit: () => void
};

const CheckDataSyncView = ({ syncStatus, currentStep, onSyncData, onSubmit }: Props) => 
    <Container>
        <R3Container>
            <R3Header>
                <Title>Vérification de la synchronisation!</Title>
            </R3Header>
            <R3Content>
                <ScrollView>
                    {
                        Object
                            .keys(syncStatus)
                            .map(table => 
                                <View key={table} style={{marginBottom: 15}}>
                                    <Text>
                                        {table}: {syncStatus[table].status}
                                    </Text>
                                    {
                                        typeof syncStatus[table].rowCount !== 'undefined' &&
                                            <Text>
                                                upload: {syncStatus[table].lastRowUploaded || 0}/{syncStatus[table].rowCount}
                                            </Text>
                                    }
                                    {
                                        typeof syncStatus[table].error !== 'undefined' &&
                                            <Text>
                                                error: {syncStatus[table].error}
                                            </Text>
                                    }
                                </View>
                            )
                    }
                </ScrollView>
            </R3Content>
            <R3Footer>
                {
                    (currentStep === 'TEXT' || true) &&
                    <CircleButton type="validate" color="blue" onPress={onSyncData} accessibilityLabel="SyncButton" />
                }
                {
                    (currentStep === 'SYNC_DONE' || true) &&
                    <CircleButton type="next" color="green" onPress={undefined} />
                }
            </R3Footer>
        </R3Container>
    </Container>;

export default CheckDataSyncView;