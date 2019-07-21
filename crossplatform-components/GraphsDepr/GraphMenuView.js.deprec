/*
 * @flow
 */

import React, { Component } from 'react';
import { View } from "react-native";

import styled from 'styled-components';

import { Tabs, Tab, TabHeading, Icon, Text } from '../../crossplatform-theme/';
import Layout from '../Layout';
import UsageGraphMenuView from './UsageGraphMenuView';
import SymptomGraphMenuController from './SymptomGraphMenuController';

type Props = {
    +menu: 'usage' | 'symptoms'
};

// Fixes https://github.com/GeekyAnts/NativeBase/issues/1010#issuecomment-448201520
// This rerender on first display only!
var _hasInitialPageRerendered = false;
const _rerenderInitialPage = (index, r) => {
    if (!_hasInitialPageRerendered) {
        setTimeout(() => r.goToPage(1));
        _hasInitialPageRerendered = true;
    } 
}

const GraphMenuView = (props: Props) => 
    <Layout>
        <Tabs
            ref={_rerenderInitialPage.bind(null, 
                {
                    usage: 0,
                    symptoms: 1
                }
                [props.menu])
            }
            locked={true}
            initialPage={
                {
                    usage: 0,
                    symptoms: 1
                }
                [props.menu]
            }
            page={
                {
                    usage: 0,
                    symptoms: 1
                }
                [props.menu]
            }
            onChangeTab={ ({i}) => { } }
            tabBarPosition="top"
            scrollWithoutAnimation={true}
        >
            <Tab heading={
                <TabHeading>
                    <Icon type="Entypo" name="circular-graph" style={{ fontSize: 20 }} />
                    <Text>Usage</Text>
                </TabHeading>
            }>
                <UsageGraphMenuView />
            </Tab>
            <Tab heading={
                <TabHeading>
                    <Icon type="Entypo" name="bar-graph" style={{ fontSize: 20 }} />
                    <Text>Symptomes</Text>
                </TabHeading>
            }>
                <SymptomGraphMenuController />
            </Tab>
        </Tabs>
    </Layout>;



export default GraphMenuView;