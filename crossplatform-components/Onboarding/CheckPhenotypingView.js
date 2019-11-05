/*
 * @flow
 */

import React from 'react';
import { View, Text } from 'react-native';

import styled from 'styled-components';

import { Container, Content, Title, Button, Form, Item, Label, Input, CircleButton, R3Container, R3Header, R3Content, R3Footer, CheckList, CLItem, CLIHeader, CLIHStatus, CLIHTitle, CLIContent } from '../../crossplatform-theme';

type Props = {

};

const CheckPhenotypingView = ({ onActivateAware, onNext }: Props) => 
    <Container accessibilityLabel="checkphenotyping">
        <R3Container>
            <R3Header>
                <Title>Activation des Senseurs</Title>
            </R3Header>
            <R3Content>
            </R3Content>
            <R3Footer>
                {
                    onActivateAware &&
                    <CircleButton type="validate" color="blue" onPress={onActivateAware} accessibilityLabel="checkphenotyping-startaware" />
                }
                {
                    onNext &&
                    <CircleButton type="next" color="green" onPress={onNext} accessibilityLabel="checkphenotyping-next" />
                }
            </R3Footer>
        </R3Container>
    </Container>;

export default CheckPhenotypingView;