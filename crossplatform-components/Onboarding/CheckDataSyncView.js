/*
 * @flow
 */

import React from 'react';
import { View, Text } from 'react-native';

import styled from 'styled-components';

import { Container, Content, Title, Button, Form, Item, Label, Input, CircleButton, R3Container, R3Header, R3Content, R3Footer, CheckList, CLItem, CLIHeader, CLIHStatus, CLIHTitle, CLIContent } from '../../crossplatform-theme';

type Props = {

};

const CheckDataSyncView = ({ onSubmit }: Props) => 
    <Container>
        <R3Container>
            <R3Header>
                <Title>Vérification de la synchronisation!</Title>
            </R3Header>
            <R3Content>
            </R3Content>
            <R3Footer>
                {
                    true &&
                    <CircleButton type="validate" color="blue" onPress={undefined} />
                }
                {
                    false &&
                    <CircleButton type="next" color="green" onPress={undefined} />
                }
            </R3Footer>
        </R3Container>
    </Container>;

export default CheckDataSyncView;