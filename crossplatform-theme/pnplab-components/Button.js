/*
 * @format
 * @flow
 */

import React from 'react';

import styled from 'styled-components';
import { TouchableOpacity, View } from "react-native";
import { Text } from "native-base";

type Props = {
    onPress: () => void,
    children?: React.Node
};

const Button = ({ onPress, disabled = false, children }: Props) => (
    <TouchableOpacity_ disabled={disabled} onPress={onPress}>
        <View_>
            <Text_>
                {children}
            </Text_>
        </View_>
    </TouchableOpacity_>
);

const TouchableOpacity_ = styled(TouchableOpacity)`
    width: 100%;
    border-width: 1px;
    border-color: ${props => !props.disabled ? '#777' : '#CCC'};
    border-radius: 5px;
    background-color: ${props => !props.disabled ? 'transparent' : '#EEE'};
    /* backgroundColor: #00000002;*/
`;

const View_ = styled(View)`
    padding: 15px;
    width: 100%;
`;

const Text_ = styled(Text)`
    text-align: center;
    font-weight: 400;
    font-size: 14px;
    color: #555;
    font-family: Roboto;
    /*letterSpacing: ;*/
`;

export default Button;