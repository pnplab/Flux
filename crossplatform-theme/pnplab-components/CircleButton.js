/*
 * @format
 * @flow
 */

import React from 'react';

import styled from 'styled-components';
import { TouchableOpacity, View } from "react-native";
import { Text, Icon } from "native-base";

type Props = {
    +onPress: () => void,
    +type: 'next' | 'validate',
    +disabled?: boolean,
    +color?: 'blue' | 'green',
    +onLongPress?: () => void,
    +delayLongPress?: number,
    +accessibilityLabel?: string
};

// Views
const VTouchableOpacity = styled(TouchableOpacity)`
    /* width: 100%; */
    border-width: 1px;
    border-color: ${({ disabled, color }) => disabled ? '#CCC' : color === 'green' ? '#3A3' : color === 'blue' ? '#58F' : '#777'};
    border-radius: 45px;
    width: 45px;
    background-color: ${({ disabled, color }) => disabled ? '#F5F5F5' : 'transparent'};
    padding: 5px;
    align-items: center;
    /* backgroundColor: #00000002;*/
`;

// Components
const CircleButton = ({ onPress, type, color = undefined, disabled = false, onLongPress = undefined, delayLongPress = undefined, accessibilityLabel = undefined}: Props) => (
    <VTouchableOpacity disabled={disabled} color={color} onPress={onPress} onLongPress={onLongPress} delayLongPress={delayLongPress} accessibilityLabel={accessibilityLabel}>
        {
            type === 'next' &&
                <Icon 
                    type="Entypo" 
                    name="chevron-small-right" 
                    style={{color: disabled ? '#CCC' : color === 'green' ? '#3A3' : color === 'blue' ? '#58F' : undefined}}
                /> || 
            type === 'validate' &&
                <Icon 
                    type="Ionicons" 
                    name="ios-checkmark" 
                    style={{color: disabled ? '#CCC' : color === 'green' ? '#3A3' : color === 'blue' ? '#58F' : undefined}}
                />
        }
    </VTouchableOpacity>
);

export default CircleButton;