
import React, { useState, useEffect } from 'react';
import { View, Text, Keyboard, KeyboardAvoidingView } from 'react-native';
import OnKeyboardHidden from './OnKeyboardHidden';
import styled from 'styled-components';

// <R2Container>
//     <R2Header />
//     <R2Footer />
// </R2Container>

// On small view, I want header/footer to take 1/5 of the space
// On large view, I want header/footer to take 1/10 of the space
// => constant space + a bit of flexi
// => header/footer padding + shrink when not enough space!
// => although not padding as depends on content. constant size!

// content / header+footer ratio should be 1/1.61803398875 (golden number) =
// 0.61803398875 ~= 0.62.
// header and footer should both be (1 - 0.62) / 2 = 0.19.
// although this is misleading if content is not filled completely because of
// white space.

const R2ContainerInternal = styled(View)`
            flex: 1;
            /*justify-content: space-between;*/
        `;
const R2Container = (props) =>
    <KeyboardAvoidingView style={{ flex: 1 }}>
        <R2ContainerInternal {...props} />
    </KeyboardAvoidingView>;

const R2HeaderWrapper = styled(View)`
        flex: ${props => !props.isKeyboardActive ? 0.62 : 0.38};
        flex-shrink: 1;

        /* wrap text content if it sticks to the border */
        margin-left: 7.225%;
        margin-right: 7.225%;

        flex-direction: column;
        justify-content: flex-end;
        align-items: center;
    `;

const R2Header = ({ children, ...props }) => {
    const [isKeyboardActive, setKeyboardActive] = useState(false);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => {
                setKeyboardActive(true);
            }
        );
        const keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            () => {
                setKeyboardActive(false);
            }
        );

        return () => {
            keyboardDidHideListener.remove();
            keyboardDidShowListener.remove();
        };
    }, []);

    return <R2HeaderWrapper isKeyboardActive={isKeyboardActive} {...props}>{children}</R2HeaderWrapper>;
}

const R2FooterWrapper = styled(View)`
        flex: ${props => !props.isKeyboardActive ? 0.38 : 0.62};
        flex-shrink: 0;

        /* wrap text content if it sticks to the border */
        margin-left: ${props => props.isPaddingOn && !props.isKeyboardActive ? '19%' : '9.5%'};
        margin-right: ${props => props.isPaddingOn && !props.isKeyboardActive ? '19%' : '9.5%'};

        flex-direction: column;
        justify-content: ${props => !props.isKeyboardActive ? 'flex-start' : 'flex-end'};
        align-items: center;
    `;

const R2Footer = ({ children, padding = false, ...props }) => {
    const [isKeyboardActive, setKeyboardActive] = useState(false);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => {
                setKeyboardActive(true);
            }
        );
        const keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            () => {
                setKeyboardActive(false);
            }
        );

        return () => {
            keyboardDidHideListener.remove();
            keyboardDidShowListener.remove();
        };
    }, []);

    return <R2FooterWrapper isPaddingOn={padding} isKeyboardActive={isKeyboardActive} {...props}>{children}</R2FooterWrapper>;
}

const R2SpacerBlock = styled(View)`
        /*
        @warning using props.display instead of props.displayed crashes the
            app.
        */
        flex: ${props => !props.displayed ? 0 : 1};
    `;

const R2Spacer = ({ onKeyboardActive = false, onKeyboardHidden = false }) => {
    // if no setting, activate whereas the android keyboard is visilbe or not.
    if (!onKeyboardActive && !onKeyboardHidden) {
        onKeyboardActive = true;
        onKeyboardHidden = true;
    }

    const [isKeyboardActive, setKeyboardActive] = useState(false);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => {
                setKeyboardActive(true);
            }
        );
        const keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            () => {
                setKeyboardActive(false);
            }
        );

        return () => {
            keyboardDidHideListener.remove();
            keyboardDidShowListener.remove();
        };
    }, []);

    return <R2SpacerBlock displayed={(onKeyboardActive && isKeyboardActive) ? true : (onKeyboardHidden && !isKeyboardActive) ? true : false} />;
}


export { R2Container, R2Header, R2Footer, R2Spacer };
