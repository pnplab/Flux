/*
 * @flow
 */

import React from 'react';
import { View, Text } from 'react-native';

import styled from 'styled-components';

import { TextButton, Container, Content, Title, Button, Form, Item, Label, Input, CircleButton, R3Container, R3Header, R3Content, R3Footer, CheckList, CLItem, CLIHeader, CLIHStatus, CLIHTitle, CLIContent } from '../../crossplatform-theme';

type Props = {
    +onStartTaskClicked: () => void,
    +onStepBypassed: () => void
};

const OnboardingSurveyTaskView = ({ onStartTaskClicked, onStepBypassed }: Props) => 
    <Container accessibilityLabel="onboarding_surveytask">
        <R3Container>
            <R3Header>
                <Title>Questionnaire</Title>
            </R3Header>
            <R3Content>
                <Text></Text>
            </R3Content>
            <R3Footer>
                <TextButton icon="next" color="green" onPress={onStartTaskClicked} onLongPress={onStepBypassed} delayLongPress={7000} accessibilityLabel="onboarding_surveytask-start_task" />
            </R3Footer>
        </R3Container>
    </Container>;

export default OnboardingSurveyTaskView;