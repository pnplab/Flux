/*
 * @flow
 */

import React from 'react';
import { View, ActivityIndicator } from 'react-native';

type Props = {

};

const AppLaoderView = (props: Props) =>
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator animating={true} size="large" color="#000" />
    </View>;

export default AppLaoderView;