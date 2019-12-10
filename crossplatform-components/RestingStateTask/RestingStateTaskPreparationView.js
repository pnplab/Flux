/*
 * @flow
 */

import React from 'react';
import { View } from 'react-native';

import styled from 'styled-components';

import { R3Container, R3Header, R3Content, R3Footer, Title, Text, TextButton } from '../../crossplatform-theme';
import LottieView from 'lottie-react-native';

type Props = {
    state: 'UNDEFINED' | 'BLUETOOTH_DISABLED' | 'MUSE_DISCONNECTED' |
        'MUSE_CONNECTING' | 'MUSE_CONNECTED',
    onStartTaskButtonClicked: () => void,
    onPostponeTaskButtonClicked?: () => void
};

const RestingStateTaskPreparationView = (props: Props) =>
    <R3Container accessibilityLabel="restingstatetask_preparation">
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
                {
                    typeof props.onPostponeTaskButtonClicked !== 'undefined' &&
                        <TextButton icon="prev" onPress={props.onPostponeTaskButtonClicked}>plus tard</TextButton>
                }
                <TextButton icon="next" onPress={props.onStartTaskButtonClicked} disabled={props.state !== 'MUSE_CONNECTED'}>continuer</TextButton>
            </ButtonBox>
        </R3Footer>
    </R3Container>;

const ButtonBox = styled(View)`
        flex-direction: row;
        justify-content: space-between;
        width: 100%;
    `;

export default RestingStateTaskPreparationView;