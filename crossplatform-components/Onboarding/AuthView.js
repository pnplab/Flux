/*
 * @flow
 */

import React from 'react';
import { View, Image } from 'react-native';

import styled from 'styled-components';

import { Container, Content, Title, Text, Form, Item, Label, Input, TextButton, R2Container, R2Header, R2Footer, R2Spacer, R3Container, R3Separator, R3Header, R3Content, R3Footer } from '../../crossplatform-theme';

import { SvgXml } from 'react-native-svg';
import svgFile from './undraw_Security_on_ff2u.svg'; // @note require instead of import doesn't work because it bypasses babel raw string import extension.

type Props = {
    +error?: string,
    +deviceId?: string,
    +onDeviceIdChanged: (deviceId: string) => void,
    +password?: string,
    +onPasswordChanged: (password: string) => void,
    +onSubmit: () => void
};

const AuthView = (props: Props) =>
    <R2Container accessibilityLabel="auth">
        <R2Header>
            <SvgXml width="100%" height="100%" xml={svgFile} />
        </R2Header>
        <R2Footer padding>
            <R2Spacer onKeyboardActive/>
            <InputView>
                <Form style={{width: '100%'}}>
                    <Item floatingLabel style={{ marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0 }}>
                        <Label style={{color: '#777', fontFamily: 'Oxygen-Light', fontSize: 14}}>numéro d'identification</Label>
                        <Input value={props.deviceId} onChangeText={deviceId => props.onDeviceIdChanged(deviceId)} accessibilityLabel="auth-deviceid" />
                    </Item>
                    <Item floatingLabel style={{ marginTop: 5, marginBottom: 0, marginLeft: 0, marginRight: 0 }}>
                        <Label style={{color: '#777', fontFamily: 'Oxygen-Light', fontSize: 14}}>code d'accès</Label>
                        <Input value={props.password} onChangeText={password => props.onPasswordChanged(password)} onSubmitEditing={e => props.onSubmit()} accessibilityLabel="auth-password" />
                    </Item>
                </Form>
                {
                    props.error &&
                    <ErrorView>
                        <Text color="red">{props.error}</Text>
                    </ErrorView>
                }
            </InputView>
            <R2Spacer />
            <ButtonView>
                <TextButton icon="next" onPress={e => props.onSubmit()} accessibilityLabel="auth-submit">authentification</TextButton>
            </ButtonView>
            <R2Spacer/>
        </R2Footer>
    </R2Container>;

// Main view, padded & centered.
const InputView = styled(View)`
        /*
        flex-direction: column;
        justify-content: center;
        */
        width: 100%;
        /* ensure a minimum space for error messages. */
    `;

// Error's view, with negative margin bottom so it doesn't adds up spaces.
const ErrorView = styled(View)`
        flex-direction: row;
        justify-content: center;
        width: 100%;

        margin-top: 5%;
        margin-left: -19%;
        width: 138%;
    `;

// Button's view, 70% button width.
const ButtonView = styled(View)`
        flex-direction: row;
        justify-content: center;
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

export default AuthView;