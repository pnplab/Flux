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
    +onNextClicked: () => void,
    +onBypassTask: () => void
};

const CheckDataSyncView = ({ syncStatus, currentStep, onSyncData, onNextClicked, onBypassTask }: Props) => 
    <Container accessibilityLabel="check_data_sync">
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
                                    <Text accessibilityLabel={`${table}Status`}>
                                        {table}: {syncStatus[table].status}
                                    </Text>
                                    {
                                        typeof syncStatus[table].rowCount !== 'undefined' &&
                                            <Text accessibilityLabel={`${table}ClientUploadCount`}>
                                                upload: {syncStatus[table].lastRowUploaded || 0}/{syncStatus[table].rowCount}
                                            </Text>
                                    }
                                    {
                                        typeof syncStatus[table].serverSideRowCount !== 'undefined' &&
                                            <Text accessibilityLabel={`${table}ServerStoredCount`}>
                                                server: {syncStatus[table].serverSideRowCount}
                                            </Text>
                                    }
                                    {
                                        typeof syncStatus[table].error !== 'undefined' &&
                                            <Text accessibilityLabel={`${table}Error`}>
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
                    currentStep === 'TEXT' &&
                    <CircleButton type="validate" color="blue" onPress={onSyncData} onLongPress={onBypassTask} accessibilityLabel="check_data_sync-sync" />
                }
                {
                    (currentStep === 'SYNC_ONGOING' || currentStep === 'SYNC_DONE') &&
                    <CircleButton type="next" color="green" onPress={onNextClicked} accessibilityLabel="check_data_sync-next" />
                }
            </R3Footer>
        </R3Container>
    </Container>;

export default CheckDataSyncView;