/*
 * @flow
 */

import React from 'react';
import { View, Text } from 'react-native';

import styled from 'styled-components';

import { Container, Content, Title, Button, Form, Item, Label, Input, CircleButton, R3Container, R3Header, R3Content, R3Footer, CheckList, CLItem, CLIHeader, CLIHStatus, CLIHTitle, CLIContent } from '../../crossplatform-theme';

type Props = {

};

const CheckPhenotypingView = ({ onSubmit }: Props) => 
    <Container>
        <R3Container>
            <R3Header>
                <Title>Gestion des Permissions</Title>
            </R3Header>
            <R3Content>
            </R3Content>
            <R3Footer>
                {
                    onRequestPermission &&
                    <CircleButton type="validate" color="blue" onPress={onRequestPermission} />
                }
                {
                    onSubmit &&
                    <CircleButton type="next" color="green" onPress={onSubmit} />
                }
            </R3Footer>
        </R3Container>
    </Container>;

export default CheckPhenotypingView;