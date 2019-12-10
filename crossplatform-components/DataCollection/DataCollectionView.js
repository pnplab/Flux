/**
 * @flow
 */

import React from 'react';
import { View } from 'react-native';

import styled from 'styled-components';
import LottieView from 'lottie-react-native';

import { SvgXml } from 'react-native-svg';
import svgFile from './undraw_cloud_sync_2aph.svg'; // @note require instead of import doesn't work because it bypasses babel raw string import extension.

import {
    R3Container,
    R3Header,
    R3Content,
    R3Footer,
    R2Container,
    R2Header,
    R2Footer,
    R2Spacer,
    Text,
    Title,
    TextButton
} from '../../crossplatform-theme';
const ANIMATION_SRC: string = require('./3165-loader.json');

type Props = {
    +showLoadingAnimation: boolean,
    +showActivateAwareButton: boolean,
    +onActivateAware: () => any,
    +onActivateAwareLongPress: () => void,
    +showFinishStepButton: boolean,
    +finishStep: () => void
};

const DataCollectionView = ({
    showLoadingAnimation,
    showActivateAwareButton,
    onActivateAware,
    onActivateAwareLongPress,
    showFinishStepButton,
    finishStep
}: Props) =>
    <R2Container accessibilityLabel="datacollection">
        <R2Header>
            <SvgXml width="100%" height="100%" xml={svgFile} />
        </R2Header>
        <R2Footer>
            <Title>Senseurs</Title>
            <R2Spacer />
            {
                showActivateAwareButton &&
                    <Text>
                        Démarrez la collecte des données de votre cellulaire.
                    </Text>
                    ||
                showLoadingAnimation &&
                    <LottieView
                        source={ANIMATION_SRC}
                        style={{margin: '10%'}}
                        autoPlay
                        loop
                    />
                    ||
                showFinishStepButton &&
                    <Text>
                        La collecte des données est active.
                    </Text>
            }
            <R2Spacer />
            {
                showActivateAwareButton &&
                    <TextButton icon="ok" color="blue" onPress={onActivateAware} onLongPress={onActivateAwareLongPress} accessibilityLabel="datacollection-startaware" />
                    ||
                showFinishStepButton &&
                    <TextButton icon="next" color="green" onPress={finishStep} accessibilityLabel="datacollection-next" />
            }
            <R2Spacer />
        </R2Footer>
    </R2Container>;

export default DataCollectionView;