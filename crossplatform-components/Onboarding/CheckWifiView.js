/*
 * @flow
 */

import React from 'react';
import { View } from 'react-native';

import styled from 'styled-components';

import { Container, Content, Title, Text, Button, Form, Item, Label, Input, CircleButton } from '../../crossplatform-theme';

type Props = {
    +status: 'undefined' | 'none' | 'wifi' | 'cellular' | 'error';
    +onSubmit: () => void
};

const CheckWifiView = ({ status, onSubmit }: Props) => 
    <Container accessibilityLabel="checkwifi">
        <EnableCenteredContent>
            <Title>Connection Internet</Title>
            <MainView>
                {
                    status === 'none' && 
                        <Text justify>
                            Veuillez connecter votre téléphone au wifi. Cette
                            étape est nécessaire au processus initial
                            d'activation de l'application.
                        </Text> ||
                    status === 'wifi' && 
                        <Text justify>
                            Votre téléphone est connecté au wifi ! Vous pouvez
                            procéder à la suite du processus d'activation de
                            l'application sans dépenser de data.
                        </Text> ||
                    status === 'cellular' &&
                        <Text justify>
                            Votre téléphone est connecté à internet mais n'est
                            pas connecté au wifi ! Vous pouvez tout de même 
                            procéder à la suite du processus d'activation de
                            l'application. Vous dépenserai 10 mo sur votre
                            forfait.
                        </Text> ||
                    status === 'error' &&
                        <Text>
                            Impossible de vérifier l'état de votre connection
                            internet. Une erreur inconnue a eu lieu. 
                        </Text>
                }
            </MainView>
            <ButtonView>
                <CircleButton type="next" success={status === 'wifi'} disabled={status !== 'wifi' && status !== 'cellular'} onPress={e => onSubmit()} accessibilityLabel="checkwifi-next" />
            </ButtonView>
        </EnableCenteredContent>
    </Container>;

// Stretched view to set free space.
const StretchedView = styled(View)`
        flex: 1;
    `;


// Main view, padded & centered.
const MainView = styled(View)`
        flex: 2;
        justify-content: center;
        width: 100%;
        padding-left: 64px;
        padding-right: 64px;
        min-height: 100px;
    `;

// Button's view, 70% button width.
const ButtonView = styled(View)`
        align-items: center;
        width: 100%;
    `;

// Error's view, with negative margin bottom so it doesn't adds up spaces.
const ErrorView = styled(View)`
        flex: 0;
        position: relative;
        bottom: 45px;
    `;

// Style container to allow content to be centered.
// @note See contentContainerStyle here `https://github.com/GeekyAnts/NativeBase/issues/1336`
const EnableCenteredContent = styled(Content)
    .attrs({
        contentContainerStyle: {
            flexGrow: 1,
            justifyContent: 'space-around'
        }
    })`
        flex: 1;
        padding-top: 45px;
        padding-bottom: 60px;
    `;

export default CheckWifiView;