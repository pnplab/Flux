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
    +onSubmit: () => void
};

const CheckPermissionsView = ({
    onSubmit
}: Props) =>
    <R3Container accessibilityLabel="checkpermissions-confirmation">
        <R3Header>
            <Title>Autorisations</Title>
        </R3Header>
        <R3Content>
            <Text>
                Les autorisations ont toutes été attribuées.
            </Text>
        </R3Content>
        <R3Footer>
            {
                onSubmit &&
                <TextButton icon="next" color="green" onPress={onSubmit} accessibilityLabel="checkpermissions-confirmation-next" />
            }
        </R3Footer>
    </R3Container>;

export default CheckPermissionsView;
