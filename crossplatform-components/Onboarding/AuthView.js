/*
 * @flow
 */

import React from 'react';
import { View } from 'react-native';

import styled from 'styled-components';

import { Container, Content, Title, Text, Button, Form, Item, Label, Input, CircleButton } from '../../crossplatform-theme';

type Props = {
    +error?: string,
    +participantId?: string,
    +onParticipantIdChanged: (participantId: string) => void,
    +password?: string,
    +onPasswordChanged: (password: string) => void,
    +onSubmit: () => void
};

const AuthView = (props: Props) => 
    <Container>
        {/* @note native-base `Content` replaces KeyboardAvoidingView! */}
        <EnableCenteredContent>
            <Title>Flux</Title>
            {/*
            <StretchedView>
                <Text>Entrez le mot de passe.</Text>
                <Text>qui vous a été fourni.</Text>
            </StretchedView>
            */}
            <InputView>
                <Form>
                    <Item floatingLabel>
                        <Label>numéro d'identification</Label>
                        <Input value={props.participantId} onChangeText={participantId => console.log('t', participantId) || props.onParticipantIdChanged(participantId)} />
                    </Item>
                    <Item floatingLabel>
                        <Label>code d'accès</Label>
                        <Input value={props.password} onChangeText={password => props.onPasswordChanged(password)} onSubmitEditing={e => props.onSubmit()} />
                    </Item>
                </Form>
            </InputView>
            {props.error &&
                <ErrorView>
                    <Text color="red" style={{position: 'absolute', textAlign: 'center', width: '100%'}}>{props.error}</Text>
                </ErrorView>
            }
            <ButtonView>
                <CircleButton type="next" onPress={e => props.onSubmit()} />
            </ButtonView>
        </EnableCenteredContent>
    </Container>;

// Stretched view to set free space.
const StretchedView = styled(View)`
        flex: 1;
    `;

// Main view, padded & centered.
const InputView = styled(View)`
        flex: 2;
        justify-content: center;
        width: 100%;
        padding-left: 64px;
        padding-right: 64px;
        min-height: 100px;
    `;

// User id input field.
const IdInput = styled(Input)
    .attrs({
        placeholder: 'Numéro d\'identification',
        autoCorrect: false,
        secureTextEntry: false
    }
    )`
        border-bottom-color: #AAA;
        border-bottom-width: 1px;
    `;

// Password input field.
const PasswordInput = styled(Input)
    .attrs({
        placeholder: 'Mot de passe',
        autoCorrect: false,
        secureTextEntry: true
    }
    )`
        border-bottom-color: #AAA;
        border-bottom-width: 1px;
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

// Grayscale gradient.
// const LinearGradient_ = styled(LinearGradient)
//     .attrs(
//     {
//         colors: ['#EEE', '#FFF', '#FFF', '#FFF', '#EEE']
//     }
//     )`
//         flex: 1;
//     `;

// Stretched content wrapper stretching down height when user's keyboard layout
// appears.
// const KeyboardAvoidingView_ = styled(KeyboardAvoidingView)
//     .attrs({
//         behavior: 'padding' 
//     })`
//         flex: 1;

//         flex-direction: column;
//         justify-content: space-between;
//         align-items: center;
//     `;

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

export default AuthView;