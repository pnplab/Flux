import React from 'react';
import { View, Text } from 'react-native';
import styled from 'styled-components';

// Views

const VCheckList = styled(View)`
        flex-grow: 1;
    `;

const VCheckListItem = styled(View)`
        flex-grow: 0;
        padding: 5px;
    `;

const VCheckListHeader = styled(View)`
        flex-grow: 0;
        flex-shrink: 0;
        flex-direction: row;
    `;

const VCheckListHeaderThumb = styled(View)`
        flex-grow: 0;
        aspect-ratio: 1;
    `;

const VCheckListHeaderTitle = styled(View)`
        flex-grow: 1;
    `;

const VCheckListContent = styled(View)`
        flex-grow: 1;
        padding-left: 20px;
        margin-top: -3px;
    `;

// Main components

const CheckList = ({ children, ...props }) => 
    <VCheckList {...props}>{children}</VCheckList>;

const CLItem = ({ children, ...props }) => <VCheckListItem {...props}>{children}</VCheckListItem>;

const CLIHeader = ({ children, ...props }) => 
    <VCheckListHeader {...props}>{children}</VCheckListHeader>;

const CLIHStatus = ({ children, style = {}, ...props }) => 
    <VCheckListHeaderThumb>
        <Text style={{textAlign: 'center', ...style}} {...props}>{children}</Text>
    </VCheckListHeaderThumb>;

const CLIHTitle = ({ children, ...props }) => 
    <VCheckListHeaderTitle>
        <Text {...props}>{children}</Text>
    </VCheckListHeaderTitle>;

const CLIContent = ({ children, ...props }) =>
    <VCheckListContent>
        <Text {...props}>{children}</Text>
    </VCheckListContent>;

export { CheckList, CLItem, CLIHeader, CLIHStatus, CLIHTitle, CLIContent };