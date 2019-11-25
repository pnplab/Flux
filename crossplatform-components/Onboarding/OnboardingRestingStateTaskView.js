/*
 * @flow
 */

import React from 'react';
import { View, Text } from 'react-native';

import styled from 'styled-components';

import { Container, Content, Title, Button, Form, Item, Label, Input, CircleButton, R3Container, R3Header, R3Content, R3Footer, CheckList, CLItem, CLIHeader, CLIHStatus, CLIHTitle, CLIContent } from '../../crossplatform-theme';

type Props = {
    +onStartTask: () => void,
    +onBypassTask: () => void
};

const OnboardingRestingStateTaskView = ({ onStartTask, onBypassTask }: Props) => 
    <Container accessibilityLabel="onboarding_restingstatetask">
        <R3Container>
            <R3Header>
                <Title>Présentation: Resting State</Title>
            </R3Header>
            <R3Content>
                <Text>Présentation de la tâche EEG.</Text>
            </R3Content>
            <R3Footer>
                <CircleButton type="next" color="green" onPress={onStartTask} onLongPress={onBypassTask} delayLongPress={7000} accessibilityLabel="onboarding_restingstatetask-start_task" />
            </R3Footer>
        </R3Container>
    </Container>;

export default OnboardingRestingStateTaskView;