/*
 * @flow
 */

import React from 'react';
import { View } from 'react-native';

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
    +onRequestPermission: () => Promise<void>,
    +onBypassRequest: () => void,
    +hasError: boolean
};

const CheckPermissionsView = ({
    onRequestPermission,
    onBypassRequest,
    hasError
}: Props) =>
    <R3Container accessibilityLabel="checkpermissions-doze">
        <R3Header>
            <Title>Autorisations</Title>
        </R3Header>
        <R3Content>
            <Text>
                Désactiver les optimisations de la batterie.
            </Text>
            <Text>
                Nous utilisons cette permission pour permettre la collecte des
                données lorsque votre cellulaire se met en veille ou redémarre.
            </Text>
            {
                hasError &&
                    <Text>
                        Une erreur est survenue !
                        Veuillez nous contacter.
                    </Text>
            }
        </R3Content>
        <R3Footer>
            {
                onRequestPermission &&
                /* @warning accessibilityLabel of both Submit & Request button have to get the same name or
                    integration testing doesn't work for some reason (didn't investigate).
                    @warning the above comment/rule is broken - should check if appium tests still works. */
                <TextButton
                    accessibilityLabel="checkpermissions-doze-request"
                    
                    icon="ok"
                    color="blue"

                    onPress={onRequestPermission}
                    onLongPress={onBypassRequest}
                    delayLongPress={7000}
                />
            }
        </R3Footer>
    </R3Container>;

export default CheckPermissionsView;
