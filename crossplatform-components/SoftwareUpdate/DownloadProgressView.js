/**
 * @flow
 */

import React from 'react';

import { ProgressBarAndroid } from 'react-native';
import { R2Container, R2Header, R2Footer, R2Spacer, Title, Text, TextButton } from '../../crossplatform-theme';

// import { SvgXml } from 'react-native-svg';
// import svgFile from './undraw_secure_data_0rwp.svg'; // @note require instead of import doesn't work because it bypasses babel raw string import extension.

type Props = {
    +percentage: ?number
    // +onPress: () => void;
};

const DownloadProgressView = ({
    percentage
}: Props) =>
    <R2Container accessibilityLabel="software.update.download-progress">
        <R2Header>
            <Title>
                Flux
            </Title>
        </R2Header>
        <R2Footer>
            <Text>
                Le téléchargement est en cours.
            </Text>
            <R2Spacer />
            <ProgressBarAndroid
                styleAttr="Horizontal"
                color="#000"
                indeterminate={typeof percentage === 'undefined'}
                progress={typeof percentage !== 'undefined' ? (1.0 * percentage / 100) : undefined}
            />
            <R2Spacer />
        </R2Footer>
    </R2Container>;

export default DownloadProgressView;