/*
 * @flow
 */

import React from 'react';
import { View } from 'react-native';

import styled from 'styled-components';

import {
    R2Container,
    R2Header,
    R2Footer,
    R2Spacer,
    Title,
    Text,
    TextButton
} from '../../crossplatform-theme';

import { SvgXml } from 'react-native-svg';
import svgFile from './undraw_secure_data_0rwp.svg'; // @note require instead of import doesn't work because it bypasses babel raw string import extension.

type Props = {
    +onStepFinished: () => void
};

const RequestPermissionsNoticeView = ({ onStepFinished }: Props) =>
    <R2Container accessibilityLabel="checkpermissions.notice">
        <R2Header>
            <SvgXml width="100%" height="100%" xml={svgFile} />
        </R2Header>
        <R2Footer>
            <Title>Autorisations</Title>
            <R2Spacer />
            <Text>
                Certains groupes de fonctionnalités requièrent
                une autorisation de votre part. Nous en faisons
                usage dans les limites mentionnées.
            </Text>
            <R2Spacer />
            <TextButton icon="ok" color="blue" onPress={onStepFinished} accessibilityLabel="checkpermissions.notice-next" />
            <R2Spacer />
        </R2Footer>
    </R2Container>;

export default RequestPermissionsNoticeView;
