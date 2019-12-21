
/*
 * @flow
 */

import React from 'react';

import {
    R3Container,
    R3Header,
    R3Content,
    R3Footer,
    Title,
    Text,
    TextButton
} from '../../crossplatform-theme';

type Props = {
    +onStartTask: () => void,
    +onBypassTask: () => void
};

const OnboardingRestingStateTaskView = ({ onStartTask, onBypassTask }: Props) => 
    <R3Container accessibilityLabel="onboarding_restingstatetask">
        <R3Header>
            <Title>Tâche vidéo</Title>
        </R3Header>
        <R3Content>
            <Text>
                La prochaine étape vous permet d'expérimenter avec
                l'électro-encéphalogramme et la vidéo. Cette tâche sera
                réalisable après le questionnaire.
            </Text>
        </R3Content>
        <R3Footer>
            <TextButton icon="next" color="green" onPress={onStartTask} onLongPress={onBypassTask} delayLongPress={5000} accessibilityLabel="onboarding_restingstatetask-start_task" />
        </R3Footer>
    </R3Container>;

export default OnboardingRestingStateTaskView;