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

};

const OnboardingEndView = ({ onSubmit }: Props) =>
    <R3Container accessibilityLabel="onboarding_end">
        <R3Header>
            <Title>Fin du processus</Title>
        </R3Header>
        <R3Content>
            <Text>
                Le processus d'initialisation de l'application est terminé.
                Affichez l'écran d'accueil de l'application en continuant.
                Cet écran s'affichera dès à présent au démarrage
                de l'application. Il vous permettra de réaliser les tâches
                durant les périodes imparties.
            </Text>
        </R3Content>
        <R3Footer>
            <TextButton icon="ok" color="blue" onPress={onSubmit} accessibilityLabel="onboarding_end-next">
                Écran d'accueil
            </TextButton>
        </R3Footer>
    </R3Container>;

export default OnboardingEndView;