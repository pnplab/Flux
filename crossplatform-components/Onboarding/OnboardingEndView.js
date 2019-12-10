/*
 * @flow
 */

import React from 'react';
import { View, Text } from 'react-native';

import styled from 'styled-components';

import { TextButton, Container, Content, Title, Button, Form, Item, Label, Input, CircleButton, R3Container, R3Header, R3Content, R3Footer, CheckList, CLItem, CLIHeader, CLIHStatus, CLIHTitle, CLIContent } from '../../crossplatform-theme';

type Props = {

};

const OnboardingEndView = ({ onSubmit }: Props) => 
    <R3Container accessibilityLabel="onboarding_end">
        <R3Header>
            <Title>Fin</Title>
        </R3Header>
        <R3Content>
        </R3Content>
        <R3Footer>
            <TextButton icon="ok" color="blue" onPress={onSubmit} accessibilityLabel="onboarding_end-next" />
        </R3Footer>
    </R3Container>;

export default OnboardingEndView;