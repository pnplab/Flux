/**
 * @flow
 */

import React from 'react';

import { FooterTab, Icon, Badge } from '../../crossplatform-theme';
import { Button, Text } from 'native-base';

export type ButtonName = 'home' | 'graphs' | 'info' | 'notifications';
type Props = {|
    +activeButton: ButtonName,
    +onButtonClicked: (buttonClicked: ButtonName) => void
|};

const Menu = (props: Props) => { 
    if (['home', 'graphs', 'info', 'notifications'].indexOf(props.activeButton) === -1) {
        throw new Error('Unknown activeButton string.');
    }
    else if (typeof props.onButtonClicked !== 'function') {
        throw new Error('onButtonClicked is not a function');
    }
    else {
        return (
            <FooterTab accessibilityLabel="menu">
                <MenuButton
                    accessibilityLabel="menu-homebutton"
                    onPress={() => { props.onButtonClicked('home'); }}
                    highlighted={props.activeButton === 'home'}

                    label="Tâches"
                    iconType="MaterialIcons"
                    iconName="playlist-add"
                />
                <MenuButton
                    accessibilityLabel="menu-graphsbutton"
                    highlighted={props.activeButton === 'graphs'}
                    disabled

                    label="Graphes"
                    iconType="Entypo"
                    iconName="line-graph"
                />
                <MenuButton
                    accessibilityLabel="menu-infobutton"
                    highlighted={props.activeButton === 'info'}
                    disabled
                    
                    label="Info"
                    iconType="MaterialIcons"
                    iconName="info-outline"
                />
                <MenuButton
                    accessibilityLabel="menu-notificationsbutton"
                    highlighted={props.activeButton === 'notifications'}
                    
                    label="Notif"
                    iconType="MaterialIcons"
                    iconName="notifications"
                    badge={2}
                />
            </FooterTab>
        );
    }
};

type MenuButtonProps = {
    +highlighted?: boolean,
    +disabled?: boolean,

    +onPress?: () => void,

    +accessibilityLabel: string,
    +label: string,
    +iconType: string,
    +iconName: string,
    +badge?: number,
};

const MenuButton = (props: MenuButtonProps) =>
    <Button
        onPress={!props.disabled ? props.onPress : undefined}
        accessibilityLabel={props.accessibilityLabel}

        vertical
        disabled={props.disabled}
        active={props.highlighted}

        badge={typeof props.badge !== 'undefined'}
    >
        {typeof props.badge !== 'undefined' &&
            <Badge>
                <Text>{props.badge}</Text>
            </Badge>
        }
        <Icon
            active={props.highlighted}
            type={props.iconType}
            name={props.iconName}
        />
        <Text>
            {props.label}
        </Text>
    </Button>;

export default Menu;
