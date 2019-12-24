/**
 * @flow
 */

import React from 'react';

import { R2Container, R2Header, R2Footer, R2Spacer, Title, Text, TextButton } from '../../crossplatform-theme';

// import { SvgXml } from 'react-native-svg';
// import svgFile from './undraw_secure_data_0rwp.svg'; // @note require instead of import doesn't work because it bypasses babel raw string import extension.

type Props = {
    +onPress: () => void;
};

const RequestDownloadView = (props: Props) =>
    <R2Container accessibilityLabel="software.update-request.not-enough-space">
        <R2Header>
            <Title>
                Flux
            </Title>
        </R2Header>
        <R2Footer>
            <Text>
                Le disque dur est rempli. Veuillez libérer de l'espace.
            </Text>
            <R2Spacer />
            {/* <TextButton icon="next" onPress={() => props.onPress()}>Télécharger</TextButton> */}
            <R2Spacer />
        </R2Footer>
    </R2Container>;

export default RequestDownloadView;