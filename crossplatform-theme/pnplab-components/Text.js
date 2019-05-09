/*
 * @format
 * @flow
 */

import React from 'react';
import { View } from "react-native";
import { Text } from "native-base";
import styled from 'styled-components';

type Props = {
    +childlen?: React.Node,
    +italic?: boolean,
    +justify?: boolean, // @warning justify only works on iOS.
    +left?: boolean
};

const Text_ = ({children, italic = false, justify = false, left = undefined, ...props}: Props) => (
    <View>
        <Text__ italic={italic} justify={justify} left={left} {...props}>
            {children}
        </Text__>
    </View>
);

const Text__ = styled(Text)`
    color: ${props => props.color || '#444'};
    font-family: Roboto;
    text-align: ${props => props.justify ? 'justify' : props.left ? 'left' : 'center'};
    font-weight: 400;
    font-style: ${props => props.italic ? 'italic' : 'normal'};
`;

export default Text_;