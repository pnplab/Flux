/*
 * @flow
 */

import React from 'react';
import { View, Text } from 'react-native';

import styled from 'styled-components';

import { Container, Content, Title, Button, Form, Item, Label, Input, CircleButton, R3Container, R3Header, R3Content, R3Footer, CheckList, CLItem, CLIHeader, CLIHStatus, CLIHTitle, CLIContent } from '../../crossplatform-theme';

type Props = {

};

const OnboardingEndView = ({ onSubmit }: Props) => 
    <Container>
        <R3Container>
            <R3Header>
                <Title>Fin</Title>
            </R3Header>
            <R3Content>
            </R3Content>
            <R3Footer>
                    <CircleButton type="validate" color="blue" onPress={onSubmit} accessibilityLabel="OnboardingEndNextButton" />
            </R3Footer>
        </R3Container>
    </Container>;

export default OnboardingEndView;