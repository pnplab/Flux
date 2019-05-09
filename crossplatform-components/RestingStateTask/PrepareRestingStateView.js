/*
 * @flow
 */

import React, { Component } from 'react';
import { View } from "react-native";

import styled from 'styled-components';

import { Title, Text, Button } from '../../crossplatform-theme/pnplab-components';
import LottieView from 'lottie-react-native';

type Props = {
    status: string,
    onPostponeTaskPushed: () => void,
    onStartTaskPushed: () => void
};

export const MuseStatus = {
    BLUETOOT_AWAITING: 'BLUETOOT_AWAITING',
    BLUETOOTH_ENABLED: 'BLUETOOTH_ENABLED',
    BLUETOOTH_DISABLED: 'BLUETOOTH_DISABLED',
    MUSE_CONNECTING: 'MUSE_CONNECTING',
    MUSE_CONNECTED: 'MUSE_CONNECTED',
    MUSE_DISCONNECTED: 'MUSE_DISCONNECTED',
};

const PrepareRestingStateView = (props: Props) => 
    <Wrapper>
        <Title>Veuillez allumer votre Muse. La connexion s'effectuera automatiquement.</Title>
        <StatusWrapper>
            <NoticeWrapper>
                <Text>
                    {
                        {
                            [MuseStatus.BLUETOOT_AWAITING]: "En attente du status bluetooth...",
                            [MuseStatus.BLUETOOTH_ENABLED]: "Bluetooth activé. En attente du muse...",
                            [MuseStatus.BLUETOOTH_DISABLED]: "Veuillez activer bluetooth.",
                            [MuseStatus.MUSE_CONNECTING]: "Muse en connexion...",
                            [MuseStatus.MUSE_CONNECTED]: "Muse connecté !",
                            [MuseStatus.MUSE_DISCONNECTED]: "Muse déconnecté !",
                        }[props.status]
                    }
                </Text>
            </NoticeWrapper>
            <LottieView
                style={{ width: '100%', maxHeight: 250 }}
                source={require('./2856-dotted-loader.json')}
                autoPlay
                loop
            />
        </StatusWrapper>
        <ButtonBox>
            {typeof props.onPostponeTaskPushed !== 'undefined' && 
                <ButtonWrapper>
                    <Button onPress={props.onPostponeTaskPushed}>PLUS TARD</Button>
                </ButtonWrapper>
            }
            <ButtonWrapper>
                <Button onPress={props.onStartTaskPushed} disabled={props.status !== MuseStatus.MUSE_CONNECTED}>CONTINUER</Button>
            </ButtonWrapper>
        </ButtonBox>
    </Wrapper>;

const Wrapper = styled(View)`
        flex: 1;
        justify-content: space-between;
        align-content: center;
        align-items: center;
        padding-top: 80px;
        padding-bottom: 80px;
        padding-left: 30px;
        padding-right: 30px;
    `;

const NoticeWrapper = styled(View)`
        max-width: 140px; // 100px == spinner width
    `;

const StatusWrapper = styled(View)`
        align-items: center;
        justify-content: space-between;
    `;

const ButtonBox = styled(View)`
        flex-direction: row;
        justify-content: space-evenly;
        width: 100%;
        padding-left: 10px;
        padding-right: 10px;
    `;
const ButtonWrapper = styled(View)`
        width: 40%;
    `;

export default PrepareRestingStateView;