/*
 * @format
 * @flow
 */

import React from 'react';
import { View } from "react-native";
import { Text } from "native-base";

type Props = {
    +childlen?: React.Node,
    +style?: any,
    +props: Array<any>,
};

const Title_ = ({children, style={}, ...props}: Props) => (
    <View>
        <Text {...props} style={{ color: props.color || '#444', fontFamily: 'Roboto', fontWeight: '500', textAlign: 'center', ...style }}>
            {children}
        </Text>
    </View>
);

export default Title_;