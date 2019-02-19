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

const dottedLoaderView = 
    <LottieView
        style={{ width: '100%', maxHeight: 250 }}
        source={require('./2856-dotted-loader.json')}
        autoPlay
        loop
    />;
const progressBarTickView = 
    <LottieView
        style={{ width: '100%', maxHeight: 250 }}
        source={require('./2947-progress-bar-tick.json')}
        autoPlay
    />;

const PrepareRestingStateView = (props: Props) => 
    <Wrapper>
        <Title>Veuillez allumer votre Muse. La connexion s'effectuera automatiquement.</Title>
        <StatusWrapper>
            <NoticeWrapper>
                <Text italic>
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
                {/*
                <Text>En attente du</Text>
                <Text>Muse...</Text>
                */}
            </NoticeWrapper>
            {
                [
                    MuseStatus.BLUETOOT_AWAITING,
                    MuseStatus.BLUETOOTH_ENABLED,
                    MuseStatus.BLUETOOTH_DISABLED,
                ].indexOf(props.status) !== -1 &&
                dottedLoaderView
            }

            {/* @warning @todo play/pause lottie animation based on current muse status */}
            {
                [
                    MuseStatus.MUSE_CONNECTING,
                    MuseStatus.MUSE_CONNECTED,
                    MuseStatus.MUSE_DISCONNECTED,
                ].indexOf(props.status) !== -1 &&
                progressBarTickView
            }
        </StatusWrapper>
        <ButtonBox>
            <ButtonWrapper>
                <Button onPress={props.onPostponeTaskPushed}>PLUS TARD</Button>
            </ButtonWrapper>
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