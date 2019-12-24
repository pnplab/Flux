/**
 * @flow
 */

import React from 'react';
import { View } from 'react-native';

import { R2Container, R2Header, R2Footer, R2Spacer, Title, Text, TextButton } from '../../crossplatform-theme';

// import { SvgXml } from 'react-native-svg';
// import svgFile from './undraw_secure_data_0rwp.svg'; // @note require instead of import doesn't work because it bypasses babel raw string import extension.

type Props = {
    +showSkipButton: boolean,
    +onSkipPress: () => void,
    +disableDownloadButton: boolean,
    +onDownloadPress: () => void,
    +onDownloadLongPress: () => void
};

const RequestDownloadView = (props: Props) =>
    <R2Container accessibilityLabel="software.update.request-download">
        <R2Header>
            <Title>
                Flux
            </Title>
        </R2Header>
        <R2Footer>
            <Text>
                Mise à jour disponible.
            </Text>
            <R2Spacer />

            <View style={{ flexDirection: 'row' }}>
                {
                    props.showSkipButton &&
                        <TextButton
                            icon="cross"
                            onPress={() => props.onSkipPress()}
                        >
                            ignorer
                        </TextButton>
                }
                <TextButton
                    icon="ok"
                    disabled={props.disableDownloadButton}
                    onPress={() => props.onDownloadPress()}
                    onLongPress={() => props.onDownloadLongPress()}
                    delayLongPress={3000}
                >
                    Télécharger
                </TextButton>
            </View>
            <R2Spacer />
        </R2Footer>
    </R2Container>;

export default RequestDownloadView;