/*
 * @flow
 */

import React from 'react';
import { View } from 'react-native';

import styled from 'styled-components';

import { Form, Input } from 'native-base';
import LinearGradient from 'react-native-linear-gradient';
import { Container, Content, Text, Button } from '../../crossplatform-theme';

type Props = {
    +error?: string,
    +participantId?: string,
    +onParticipantIdChanged: (participantId: string) => void,
    +password?: string,
    +onPasswordChanged: (password: string) => void,
    +onSubmit: () => void
};

const InitialSetupView = (props: Props) => 
    <Container>
        <EnableCenteredContent>
            {/* <LinearGradient_> */}
            {/* In android, it works without KeyboardAvoidingView & *doesn't work with it!* */}
            {/*<KeyboardAvoidingView_>*/}
            <StretchedView></StretchedView>
            <StretchedView>
                <Text>Entrez le mot de passe.</Text>
                <Text>qui vous a été fourni.</Text>
            </StretchedView>
            {props.error &&
                <ErrorView>
                    <Text color='red'>{props.error}</Text>
                </ErrorView>
            }
            <InputView>
                <Form>
                    <IdInput value={props.participantId} onChangeText={participantId => props.onParticipantIdChanged(participantId)} />
                    <PasswordInput value={props.password} onChangeText={password => props.onPasswordChanged(password)} onSubmitEditing={e => props.onSubmit()} />
                </Form>
            </InputView>
            <ButtonView>
                <Button icon="arrow-dropright-circle" onPress={e => props.onSubmit()}>
                    ACTIVATION
                </Button>
            </ButtonView>
            <StretchedView></StretchedView>
            {/*</KeyboardAvoidingView_>*/}
            {/* </LinearGradient_> */}
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
        padding-left: 25px;
        padding-right: 25px;
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
        flex: 1;
        justify-content: flex-end;
        width: 100%;
        padding-left: 80px;
        padding-right: 80px;
    `;

// Error's view, with negative margin bottom so it doesn't adds up spaces.
const ErrorView = styled(View)`
        flex: 0;
        margin-bottom: -21px;
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
            flexGrow: 1
        }
    })`
        flex: 1;
    `;

export default InitialSetupView;