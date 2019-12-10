/*
 * @flow
 */

import React from 'react';
import { View } from 'react-native';

import styled from 'styled-components';

import { R3Container, R3Header, R3Content, R3Footer, Title, Text, Button, Form, Item, Label, Input, TextButton } from '../../crossplatform-theme';

type Props = {
    +status: 'undefined' | 'none' | 'wifi' | 'cellular' | 'error';
    +onSubmit: () => void
};

const CheckWifiView = ({ status, onSubmit }: Props) => 
    <R3Container accessibilityLabel="checkwifi">
        <R3Header>
            <Title>Internet</Title>
        </R3Header>
        <R3Content>
            {
                status === 'none' && 
                    <Text>
                        Veuillez connecter votre téléphone au wifi. Cette
                        étape est nécessaire au processus initial
                        d'activation de l'application.
                    </Text> ||
                status === 'wifi' && 
                    <Text>
                        Votre téléphone est connecté au wifi ! Procédez à la
                        suite du processus d'activation sans dépenser de
                        data.
                    </Text> ||
                status === 'cellular' &&
                    <Text>
                        Votre téléphone est connecté à internet mais n'est
                        pas connecté au wifi ! Vous pouvez tout de même 
                        procéder à la suite du processus d'activation de
                        l'application. Vous dépenserez 10 mo sur votre
                        forfait.
                    </Text> ||
                status === 'error' &&
                    <Text>
                        Impossible de vérifier l'état de votre connection
                        internet. Une erreur inconnue a eu lieu. 
                    </Text>
            }
        </R3Content>
        <R3Footer>
            <ButtonView>
                <TextButton icon="next" success={status === 'wifi'} disabled={status !== 'wifi' && status !== 'cellular'} onPress={e => onSubmit()} accessibilityLabel="checkwifi-next" />
            </ButtonView>
        </R3Footer>
    </R3Container>;

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

export default CheckWifiView;