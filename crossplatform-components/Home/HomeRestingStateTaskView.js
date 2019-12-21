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

const HomeRestingStateTaskView = (props: Props) =>
    <R2Container accessibilityLabel="home-surveytask">
        <R2Header>
            <LottieView
                source={ANIMATION_SRC}
                autoPlay
                loop
            />
        </R2Header>
        <R2Footer>
            <Title>Video</Title>
            <R2Spacer />
            <Text>La vidéo est actuellement accessible. Continuez pour débuter la tâche.</Text>
            <R2Spacer />
            <TextButton icon="next" onPress={e => props.onStartTaskClicked()}>
                COMMENCER
            </TextButton>
            <R2Spacer />
        </R2Footer>
    </R2Container>;

export default HomeRestingStateTaskView;