/*
 * @flow
 */

import React from 'react';
import { View, ScrollView, Text as RawText } from 'react-native';

import {
    R3Container,
    R3Header,
    R3Content,
    R3Footer,
    TextButton,
    Title,
    Text
} from '../../crossplatform-theme';

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
    <R3Container accessibilityLabel="check_data_sync">
        <R3Header>
            <Title>Synchronisation</Title>
        </R3Header>
        <R3Content>
            <Text>
                Cette étape nous permet de valider le bon fonctionnement de
                la synchronisation de vos données. Vous pouvez continuer le
                processus en toute quiétude.
            </Text>
            <ScrollView style={{ marginTop: 30, marginBottom: 30 }}>
                {
                    Object
                        .keys(syncStatus)
                        .map(table =>
                            <View key={table} style={{marginBottom: 15}}>
                                <RawText accessibilityLabel={`${table}Status`}>
                                    {table}: {syncStatus[table].status}
                                </RawText>
                                {
                                    typeof syncStatus[table].rowCount !== 'undefined' &&
                                        <RawText accessibilityLabel={`${table}ClientUploadCount`}>
                                            upload: {syncStatus[table].lastRowUploaded || 0}/{syncStatus[table].rowCount}
                                        </RawText>
                                }
                                {
                                    typeof syncStatus[table].serverSideRowCount !== 'undefined' &&
                                        <RawText accessibilityLabel={`${table}ServerStoredCount`}>
                                            server: {syncStatus[table].serverSideRowCount}
                                        </RawText>
                                }
                                {
                                    typeof syncStatus[table].error !== 'undefined' &&
                                        <RawText accessibilityLabel={`${table}Error`}>
                                            error: {syncStatus[table].error}
                                        </RawText>
                                }
                            </View>
                        )
                }
            </ScrollView>
        </R3Content>
        <R3Footer>
            {
                currentStep === 'TEXT' &&
                <TextButton icon="ok" color="blue" onPress={onSyncData} onLongPress={onBypassTask} delayLongPress={5000} accessibilityLabel="check_data_sync-sync" />
            }
            {
                (currentStep === 'SYNC_ONGOING' || currentStep === 'SYNC_DONE') &&
                <TextButton icon="next" color="green" onPress={onNextClicked} accessibilityLabel="check_data_sync-next">
                    continuer
                </TextButton>
            }
        </R3Footer>
    </R3Container>;

export default CheckDataSyncView;