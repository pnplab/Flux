/*
 * @flow
 */

import type { State as AppState } from '../../crossplatform-model/memory-db/types';
import { openSurveyTask, openGraphs } from '../../crossplatform-model/memory-db/actions';

import React, { Component } from 'react';
import { connect } from 'react-redux';

import styled from 'styled-components';
import { Container, Header, Content, Footer, FooterTab, Icon, Badge } from '../../crossplatform-theme';
import { Button, Text } from 'native-base';

type Props = {
    +activeRoute: string,
    +children: Array<any>,
    +openSurveyTask: () => void,
    +openGraphs: () => void,
};

const Layout = (props: Props) =>
    <Container>
        {/*<Header />*/}
        <EnableCenteredContent>
            {props.children}
        </EnableCenteredContent>
        <Footer>
            <FooterTab>
                <MenuButton onPress={props.openSurveyTask} label="Tâches" activeRoute={props.activeRoute} route="/" icon="MaterialIcons/playlist-add" />
                <MenuButton onPress={props.openGraphs} label="Graphes" activeRoute={props.activeRoute} route="/graph" icon="Entypo/line-graph" />
                <MenuButton label="Info" activeRoute={props.activeRoute} route="/info" icon="MaterialIcons/info-outline" />
                <MenuButton label="Notif" activeRoute={props.activeRoute} route="/notification" icon="MaterialIcons/notifications" badge={2} />
            </FooterTab>
        </Footer>
    </Container>;

type MenuButtonProps = {
    +activeRoute: string,
    +route: string,

    +badge?: number,
    +label: string,
    +icon: string,
};

const MenuButton = (props: MenuButtonProps) => 
    <Button vertical active={props.route === "/" ? props.activeRoute === "/" : props.activeRoute.startsWith(props.route)} badge={typeof props.badge !== 'undefined'} onPress={e => props.onPress && props.onPress()}>
        {typeof props.badge !== 'undefined' &&
        <Badge>
            <Text>{props.badge}</Text>
        </Badge>
        }
        <Icon active={props.activeRoute.startsWith(props.route)} type={props.icon.split('/')[0]} name={props.icon.split('/')[1]} />
        <Text>
            {props.label}
        </Text>
    </Button>;
 
// Style container to allow content to be centered.
// @note See contentContainerStyle here `https://github.com/GeekyAnts/NativeBase/issues/1336`
const EnableCenteredContent = styled(Content).attrs(
    {
        contentContainerStyle: {
            flexGrow: 1
        }
    }
    )`
        flex: 1;
    `;

// Bind redux to Layout.
const mapStateToProps = (state: AppState /*, ownProps*/) => ({
    activeRoute: state.route
});

const mapDispatchToProps = {
    openSurveyTask,
    openGraphs
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(React.memo(Layout));
