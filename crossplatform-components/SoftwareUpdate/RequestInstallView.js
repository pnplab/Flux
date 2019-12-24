/**
 * @flow
 */

import React from 'react';

import { R2Container, R2Header, R2Footer, R2Spacer, Title, Text, TextButton } from '../../crossplatform-theme';

// import { SvgXml } from 'react-native-svg';
// import svgFile from './undraw_secure_data_0rwp.svg'; // @note require instead of import doesn't work because it bypasses babel raw string import extension.

type Props = {
    +onPress: () => void,
    +onLongPress: () => void
};

const RequestInstallView = (props: Props) =>
    <R2Container accessibilityLabel="software.update.request-install">
        <R2Header>
            <Title>
                Flux
            </Title>
        </R2Header>
        <R2Footer>
            <Text>
                Mise à jour téléchargée.
            </Text>
            <R2Spacer />
            <TextButton icon="next-out" onPress={() => props.onPress()} onLongPress={() => props.onLongPress()} delayLongPress={3000}>Installer</TextButton>
            <R2Spacer />
        </R2Footer>
    </R2Container>;

export default RequestInstallView;