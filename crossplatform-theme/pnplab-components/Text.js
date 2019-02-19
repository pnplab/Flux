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
    +props: Array<any>
};

const Text_ = ({children, italic = false, ...props}: Props) => (
    <View>
        <Text__ italic={italic} {...props}>
            {children}
        </Text__>
    </View>
);

const Text__ = styled(Text)`
    color: ${props => props.color || '#444'};
    font-family: Roboto;
    text-align: center;
    font-weight: 400;
    font-style: ${props => props.italic ? 'italic' : 'normal'};
`;

export default Text_;