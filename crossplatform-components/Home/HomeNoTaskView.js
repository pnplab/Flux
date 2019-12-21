/**
 * @flow
 */

import React from 'react';
import { View } from 'react-native';

import styled from 'styled-components';

import { R2Container, R2Header, R2Footer, R2Spacer, Title, Text } from '../../crossplatform-theme';

import { SvgXml } from 'react-native-svg';
import svgFile from './undraw_secure_data_0rwp.svg'; // @note require instead of import doesn't work because it bypasses babel raw string import extension.

type Props = {

};

const HomeNoTaskView = (props: Props) =>
    <R2Container accessibilityLabel="home-notask">
        <R2Header>
            <SvgXml width="100%" height="100%" xml={svgFile} />
        </R2Header>
        <R2Footer>
            <Title>
                Flux
            </Title>
            <R2Spacer />
            <Text>
                Les tâches ne sont actuellement pas disponibles. Elles seront accessible à partir de 18h, jusqu'à 22h.
            </Text>
            <R2Spacer />
            <R2Spacer />
        </R2Footer>
    </R2Container>;


export default HomeNoTaskView;