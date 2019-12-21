/*
 * @flow
 */

import React from 'react';

import styled from 'styled-components';

import {
    R3Container,
    R3Header,
    R3Content,
    R3Footer,
    Text,
    TextButton,
    Title
} from '../../crossplatform-theme';

type Props = {
    +onStartTaskClicked: () => void,
    +onStepBypassed: () => void
};

const OnboardingSurveyTaskView = ({ onStartTaskClicked, onStepBypassed }: Props) => 
    <R3Container accessibilityLabel="onboarding_surveytask">
        <R3Header>
            <Title>Questionnaire</Title>
        </R3Header>
        <R3Content>
            <Text>
                La prochaine étape vous permet d'expérimenter avec le
                questionnaire que vous compléterez lorsque vous utiliserez
                l'application durant les heures des tâches est visualisable.
            </Text>
        </R3Content>
        <R3Footer>
            <TextButton icon="next" color="green" onPress={onStartTaskClicked} onLongPress={onStepBypassed} delayLongPress={5000} accessibilityLabel="onboarding_surveytask-start_task" />
        </R3Footer>
    </R3Container>;

export default OnboardingSurveyTaskView;