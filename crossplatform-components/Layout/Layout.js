/*
 * @flow
 */

import React from 'react';
import type { ChildrenArray, Element } from 'react';

import styled from 'styled-components';
import { Container, Content, Footer } from '../../crossplatform-theme';

type Props = {
    +menuComponent: Element<any>,
    +children?: ChildrenArray<any>,
};

const Layout = (props: Props) => {
    // Check menuComponent element.
    if (!React.isValidElement(props.menuComponent)) {
        throw new Error('menuComponent should be a react element.');
    }

    return(
        <Container>
            <EnableCenteredContent>
                {props.children}
            </EnableCenteredContent>
            <Footer>
                {props.menuComponent}
            </Footer>
        </Container>
    );
};

export default Layout;

// Style container to allow content to be centered.
// @note See contentContainerStyle here `https://github.com/GeekyAnts/NativeBase/issues/1336`
const EnableCenteredContent = styled(Content)
    .attrs({
        contentContainerStyle: {
            flexGrow: 1
        }
    })`
        flex: 1;
    `;