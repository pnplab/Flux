/**
 * @flow
 */

import React from 'react';
import { View } from 'react-native';

import styled from 'styled-components';

import { Text, Button } from '../../crossplatform-theme/pnplab-components';
import LottieView from 'lottie-react-native';

const ANIMATION_SRC: string = require('./2843-mobile-app.json');

type Props = {
    +onStartTaskClicked: () => void
};

const HomeSurveyTaskView = (props: Props) =>
    <ViewWrapper accessibilityLabel="home-surveytask">
        <TextWrapper>
            <Text>Le questionnaire est disponible.</Text>
        </TextWrapper>
        <LottieViewWrapper
            source={ANIMATION_SRC}
            autoPlay
            loop
        />
        <StartTaskButtonWrapper>
            <Button icon="arrow-dropright-circle" onPress={e => props.onStartTaskClicked()}>
                COMMENCER
            </Button>
        </StartTaskButtonWrapper>
    </ViewWrapper>;

// Center position wrapper.
const ViewWrapper = styled(View)`
    position: relative;
    flex: 1;
    justifyContent: center;
    alignItems: center;
`;

// Positioned lottie (animation) component.
const LottieViewWrapper = styled(LottieView)`
    marginTop: 75;
    marginRight: 30;
    marginBottom: 75;
    marginLeft: 30;
`;

// Wrapper to position the text relatively to the main linear gradient view.
const TextWrapper = styled(View)`
    position: absolute;
    width: 100%;
    top: 100px;
`;

// Wrapper to position the button relatively to the main linear gradient view.
const StartTaskButtonWrapper = styled(View)`
    position: absolute;
    bottom: 80px;
    width: 70%;
`;

export default HomeSurveyTaskView;