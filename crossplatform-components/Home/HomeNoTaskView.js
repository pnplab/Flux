/**
 * @flow
 */

import React from 'react';
import { View } from 'react-native';

import styled from 'styled-components';

import { Text } from '../../crossplatform-theme/pnplab-components';
import LottieView from 'lottie-react-native';

const ANIMATION_SRC: string = require('./3165-loader.json');

type Props = {

};

const HomeNoTaskView = (props: Props) =>
    <ViewWrapper accessibilityLabel="home-notask">
        <TextWrapper>
            <Text>Le test n'est pas disponible pour le moment.</Text>
            <Text>Revenez plus tard.</Text>
        </TextWrapper>
        <LottieView
            style={{ marginTop: 75, marginLeft: 30, marginRight: 30 }}
            source={ANIMATION_SRC}
            autoPlay
            loop
        />
    </ViewWrapper>;

// Center position wrapper.
const ViewWrapper = styled(View)`
    position: relative;
    flex: 1;
    justifyContent: center;
    alignItems: center;
`;

// Wrapper to position the text relatively to the main linear gradient view.
const TextWrapper = styled(View)`
    position: absolute;
    width: 100%;
    top: 100px;
`;

export default HomeNoTaskView;