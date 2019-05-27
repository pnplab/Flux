import React from 'react';
import { View } from 'react-native';
import styled from 'styled-components';

// <R3Container>
//     <R3Header />
//     <R3Content />
//     <R3Footer />
// </R3Container>

const R3Container = styled(View)`
        flex: 1;
    `;

const R3Header = styled(View)`
        height: 100px;
        flex-shrink: 0;
        justify-content: center;
        align-items: center;
    `;

const R3Content = styled(View)`
        flex-grow: 1;
        flex-shrink: 1;
        padding: 30px;
    `;

const R3Footer = styled(View)`
        height: 100px;
        flex-direction: row;
        justify-content: space-evenly;
        flex-shrink: 0;
        justify-content: center;
        align-items: center;
    `;

export { R3Container, R3Header, R3Content, R3Footer };
