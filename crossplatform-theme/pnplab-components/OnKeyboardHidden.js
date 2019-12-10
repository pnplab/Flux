
import React, { useState, useEffect } from 'react';
import { View, Keyboard } from 'react-native';

export default ({ children, ...props }) => {
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => {
                setKeyboardVisible(true);
            }
        );
        const keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            () => {
                setKeyboardVisible(false);
            }
        );

        return () => {
            keyboardDidHideListener.remove();
            keyboardDidShowListener.remove();
        };
    }, []);

    if (isKeyboardVisible) {
        return <View></View>;
    }
    else {
        return <View {...props}>{children}</View>;
    }
}
