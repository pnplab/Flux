/*
 * @format
 * @flow
 */

import React from 'react';
import { View, Text } from 'react-native';
import styled from 'styled-components';

type Props = {
    +childlen?: React.Node,
    +style?: any,
    +props: Array<any>,
};

const StyledText = styled(Text)`
        color: ${props => props.color || '#333'};
        font-family: Oxygen-Medium;
        font-size: 30;
        text-align: center;
        /* text-transform: lowercase; */
        width: 100%;
    `;

const Title_ = ({children, style={}, ...props}: Props) => (
    <View>
        <View style={{ flexDirection: 'row' }}>
            {/*
            <View style={{ paddingTop: 5, paddingRight: 20, justifyContent: 'center' }}>
                <Text>•</Text>
            </View>
            */}
            <StyledText>{children}</StyledText>
            {/*
            <View style={{ paddingTop: 5, paddingLeft: 20, justifyContent: 'center' }}>
                <Text>•</Text>
            </View>
            */}
        </View>
    </View>
);

export default Title_;