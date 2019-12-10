/*
 * @flow
 */

import React, { Component } from 'react';
import { View } from 'react-native';

import styled from 'styled-components';

import { Title, Text, Button } from '../../crossplatform-theme/pnplab-components';
import { Container, R3Container, R3Header, R3Content, R3Footer } from '../../crossplatform-theme';
import LottieView from 'lottie-react-native';

type Props = {
    state: 'UNDEFINED' | 'BLUETOOTH_DISABLED' | 'MUSE_DISCONNECTED' |
        'MUSE_CONNECTING' | 'MUSE_CONNECTED',
    onStartTaskButtonClicked: () => void,
    onPostponeTaskButtonClicked?: () => void
};

const RestingStateTaskPreparationView = (props: Props) =>
    <Container accessibilityLabel="restingstatetask_preparation">
        <R3Container>
            <R3Header>
                <Title>Connection</Title>
            </R3Header>
            <R3Content>
                <View style={{ alignItems: 'center', flexGrow: 1, flexShrink: 0 }}>
                    <Text>
                        Veuillez allumer votre Muse. La connexion s'effectuera automatiquement.
                    </Text>
                </View>
                <View style={{ alignItems: 'center', flexGrow: 5, flexShrink: 1 }}>
                    <LottieView
                        style={{marginTop: -15}}
                        source={require('./2856-dotted-loader.json')}
                        autoPlay
                        loop
                    />
                </View>
                <View style={{ alignItems: 'center', flexGrow: 1, flexShrink: 0 }}>
                    <Text>
                        {
                            {
                                UNDEFINED: 'En attente du status bluetooth...',
                                BLUETOOTH_DISABLED: 'Veuillez activer bluetooth.',
                                MUSE_DISCONNECTED: 'Muse déconnecté !',
                                MUSE_CONNECTING: 'Muse en connexion...',
                                MUSE_CONNECTED: 'Muse connecté !',
                            }[props.state]
                        }
                    </Text>
                </View>
            </R3Content>
            <R3Footer>
                <ButtonBox>
                    {typeof props.onPostponeTaskButtonClicked !== 'undefined' &&
                        <ButtonWrapper>
                            <Button onPress={props.onPostponeTaskButtonClicked}>PLUS TARD</Button>
                        </ButtonWrapper>
                    }
                    <ButtonWrapper>
                        <Button onPress={props.onStartTaskButtonClicked} disabled={props.state !== 'MUSE_CONNECTED'}>CONTINUER</Button>
                    </ButtonWrapper>
                </ButtonBox>
            </R3Footer>
        </R3Container>
    </Container>;

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

export default RestingStateTaskPreparationView;