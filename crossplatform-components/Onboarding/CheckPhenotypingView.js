/**
 * @flow
 */

import React from 'react';
import { View, Text } from 'react-native';

import styled from 'styled-components';
import LottieView from 'lottie-react-native';

import {
    Container,
    Content,
    Title,
    Button,
    Form,
    Item,
    Label,
    Input,
    CircleButton,
    R3Container,
    R3Header,
    R3Content,
    R3Footer,
    CheckList,
    CLItem,
    CLIHeader,
    CLIHStatus,
    CLIHTitle,
    CLIContent
} from '../../crossplatform-theme';
const ANIMATION_SRC: string = require('./3165-loader.json');

type Props = {
    +showActivateAwareButton: boolean,
    +onActivateAware: () => any,
    +onActivateAwareLongPress: () => void,
    +showFinishStepButton: boolean,
    +finishStep: () => void
};

const CheckPhenotypingView = ({
    showActivateAwareButton,
    onActivateAware,
    onActivateAwareLongPress,
    showFinishStepButton,
    finishStep
}: Props) =>
    <Container accessibilityLabel="checkphenotyping">
        <R3Container>
            <R3Header>
                <Title>Activation des Senseurs</Title>
            </R3Header>
            <R3Content>
                {
                    !showActivateAwareButton &&
                    !showFinishStepButton &&
                        <LottieView
                            source={ANIMATION_SRC}
                            autoPlay
                            loop
                        />
                }
            </R3Content>
            <R3Footer>
                {
                    showActivateAwareButton &&
                    <CircleButton type="validate" color="blue" onPress={onActivateAware} onLongPress={onActivateAwareLongPress} accessibilityLabel="checkphenotyping-startaware" />
                }
                {
                    showFinishStepButton &&
                    <CircleButton type="next" color="green" onPress={finishStep} accessibilityLabel="checkphenotyping-next" />
                }
            </R3Footer>
        </R3Container>
    </Container>;

export default CheckPhenotypingView;