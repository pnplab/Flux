import React from 'react';
import { View, Text, KeyboardAvoidingView } from 'react-native';
import OnKeyboardHidden from './OnKeyboardHidden';
import styled from 'styled-components';

// <R3Container>
//     <R3Header />
//     <R3Content />
//     <R3Footer />
// </R3Container>

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

// @todo keyboard avoiding view.
const R3ContainerInternal = styled(View)`
            flex: 1;
            justify-content: space-between;
        `;
const R3Container = (props) =>
    <KeyboardAvoidingView style={{flex: 1}}>
        <R3ContainerInternal {...props} />
    </KeyboardAvoidingView>;

const R3Content = styled(View)`
        /* flex: 1; */

        flex: 0.62;
        flex-shrink: 0;

        /* wrap text content if it sticks to the border */
        margin-left: ${props => props.nomargin ? '0' : '7.225%'};
        margin-right: ${props => props.nomargin ? '0' : '7.225%'};
    `;

const R3SeparatorWrapper = styled(View)`
        flex: 0;
        flex-shrink: 100;

        height: 0;
    `;
const R3SeparatorText = styled(Text)`
        text-align: center;
        font-size: 14;
        color: ${props => props.color || '#333'};
    `;

const R3Separator = (props) =>
    <OnKeyboardHidden>
        <R3SeparatorWrapper>
            <R3SeparatorText {...props}>•</R3SeparatorText>
        </R3SeparatorWrapper>
    </OnKeyboardHidden>;

const R3Header = styled(View)`
        /* flex: 0; */

        flex: 0.19;
        flex-grow: 0.38;
        flex-shrink: 1;
        /* height: 100px; */

        /*
        integrate 24/2 status bar inside the size.
        cf. https://stackoverflow.com/questions/3407256/height-of-status-bar-in-android
        @todo ios is 20/2
        cf. https://stackoverflow.com/questions/12991935/how-to-programmatically-get-ios-status-bar-height
        */
        margin-top: -12;

        /* wrap text content if it sticks to the border */
        margin-left: 7.225%;
        margin-right: 7.225%;

        justify-content: center;
        align-items: flex-end;
    `;

const R3Footer = styled(View)`
        /* flex: 0; */

        flex: 0.19;
        flex-shrink: 1;
        /* height: 100px; */

        /* wrap text content if it sticks to the border */
        margin-left: 7.225%;
        margin-right: 7.225%;

        flex-direction: row;
        justify-content: space-evenly;
        justify-content: center;
        align-items: flex-start;

        /* background-color: #EEE; */
    `;

export { R3Container, R3Header, R3Separator, R3Content, R3Footer };
