/**
 * @flow
 */

import React from 'react';

import { R2Container, R2Header, R2Footer, R2Spacer, Title, Text, TextButton } from '../../crossplatform-theme';
import LottieView from 'lottie-react-native';

const ANIMATION_SRC: string = require('./2843-mobile-app.json');

type Props = {
    +onStartTaskClicked: () => void
};

const HomeSurveyTaskView = (props: Props) =>
    <R2Container accessibilityLabel="home-surveytask">
        <R2Header>
            <LottieView
                source={ANIMATION_SRC}
                autoPlay
                loop
            />
        </R2Header>
        <R2Footer>
            <Title>Questionnaire</Title>
            <R2Spacer />
            <Text>Le questionnaire est actuellement accessible. Continuez pour le remplir.</Text>
            <R2Spacer />
            <TextButton icon="next" onPress={e => props.onStartTaskClicked()}>
                CONTINUER
            </TextButton>
            <R2Spacer />
        </R2Footer>
    </R2Container>;

export default HomeSurveyTaskView;