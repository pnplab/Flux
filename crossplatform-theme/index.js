/**
 * @flow
 */
export { default as getTheme } from './components';
export { Header, Content, Footer, FooterTab, Icon, Badge, Tabs, Tab, TabHeading, List, ListItem, CheckBox, Left, Body, Right, Segment, Form, Item, Label, Input } from 'native-base';

// Fix native-base broken <Container> height after react-native 0.61.2 and
// native-base 2.13.8 upgrade. Bug seen in <Onboarding> -> <Auth>, probably
// appearing in all other components relying on <Container> as well. Didn't saw
// any ticket / upgrade for similar issue in both NB and RN. Fix has been found
// using `React Native Debugger` app to update style in real time. Probably a
// good idea to move off useless design dependencies and copy/paste code
// instead for more stability. Note the fix didn't work using
// `styled-component`.
import React from 'react'; // Req. in order to use jsx.
import { Container as BuggyContainer } from 'native-base';
const FixedContainer = ({children, style, ...props}: any) =>
    <BuggyContainer style={{flex: 0, ...style}} {...props}>
        {children}
    </BuggyContainer>;
export const Container = FixedContainer;

export * from './pnplab-components';