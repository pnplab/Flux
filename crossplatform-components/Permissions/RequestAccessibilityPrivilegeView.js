/*
 * @flow
 */

import React from 'react';
import { Image, View } from 'react-native';

import styled from 'styled-components';

import {
    R3Container,
    R3Header,
    R3Content,
    R3Footer,
    Title,
    Text,
    TextButton
} from '../../crossplatform-theme';

type Props = {
    +onRequestPermission: () => void,
    +onBypassRequest: () => void,
    +onNextStep: () => void,
    +currentStep: 'usage' | 'screenshot1' | 'screenshot2' | 'screenshot3'
};

const CheckPermissionsView = ({
    onRequestPermission,
    onBypassRequest,
    onNextStep,
    currentStep
}: Props) =>
    <R3Container accessibilityLabel="checkpermissions-accessibility">
        <R3Header>
            <Title>Autorisations</Title>
        </R3Header>
        <R3Content nomargin={currentStep !== 'usage'}>
            {
                currentStep === 'usage' &&
                <>
                    <Text>
                        Service d'accessibilité.
                    </Text>
                    <Text>
                        Nous utilisons uniquement cette permission pour enregistrer
                        le taux d'utilisation des applications (par exemple, le nombre
                        d'heure passé sur facebook). Nous n'utilisons la permission
                        dans aucun autre cadre (eg. nous n'enregistrons pas le contenu
                        des applications).
                    </Text>
                </> ||
                currentStep === 'screenshot1' &&
                    <View style={{ flex: 1, paddingLeft: 10, paddingRight: 10, paddingBottom: 50, flexDirection: 'row' }}>
                        <Image
                            source={require('./accessibility-setting-screen.png')}
                            style={{
                                flex: 1,
                                height: '100%',
                                resizeMode: 'contain'
                            }}
                        />
                        <Text style={{
                            flex: 0.68,
                            textAlign: 'left'
                        }}>
                            Lorsque le panel de configuration des services
                            d'accessibilité s'affichera, ouvrez Flux.
                        </Text>
                    </View> ||
                currentStep === 'screenshot2' &&
                    <View style={{ flex: 1, paddingLeft: 10, paddingRight: 10, paddingBottom: 50, flexDirection: 'row' }}>
                        <Image
                            source={require('./accessibility-flux-screen.png')}
                            style={{
                                flex: 1,
                                height: '100%',
                                resizeMode: 'contain'
                            }}
                        />
                        <Text style={{
                            flex: 0.68,
                            textAlign: 'left'
                        }}>
                            Cliquez ensuite sur le bouton d'activation.
                        </Text>
                    </View> ||
                currentStep === 'screenshot3' &&
                    <View style={{ flex: 1, paddingLeft: 10, paddingRight: 10, paddingBottom: 50, flexDirection: 'row' }}>
                        <Image
                            source={require('./accessibility-popup-screen.png')}
                            style={{
                                flex: 1,
                                height: '100%',
                                resizeMode: 'contain'
                            }}
                        />
                        <Text style={{
                            flex: 0.68,
                            textAlign: 'left'
                        }}>
                            Acceptez enfin la requête de permission.
                            L'application reviendra alors automatiquement.
                        </Text>
                    </View>
            }
        </R3Content>
        <R3Footer>
            {
                currentStep !== 'screenshot3' &&
                    <TextButton
                        accessibilityLabel="checkpermissions-accessibility-next"

                        icon="next"
                        color="blue"

                        onPress={onNextStep}
                        onLongPress={onBypassRequest}
                        delayLongPress={7000}
                    />
                    ||
                    <TextButton
                        accessibilityLabel="checkpermissions-accessibility-request"

                        icon="next-out"
                        color="blue"

                        onPress={onRequestPermission}
                        onLongPress={onBypassRequest}
                        delayLongPress={7000}
                    >
                        Ouvrir les préférences
                    </TextButton>
            }
        </R3Footer>
    </R3Container>;

export default CheckPermissionsView;
