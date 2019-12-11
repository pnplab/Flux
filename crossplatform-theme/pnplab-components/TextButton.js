/*
 * @flow
 */

import React from 'react';

import styled from 'styled-components';
import { TouchableOpacity, View } from 'react-native';
import { Text, Icon } from 'native-base';

type Props = {
    +children: string,
    +onPress: () => void,
    +icon: 'prev' | 'next' | 'ok',
    +disabled ?: boolean,
    +color ?: 'blue' | 'green',
    +onLongPress ?: () => void,
    +delayLongPress ?: number,
    +accessibilityLabel ?: string
};

// Color scheme of both the text and the icon.
const colors = {
    disabled: '#CCC',
    green: '#3A3',
    blue: '#58F',
    default: '#333'
};

// Views
/* eslint-disable indent */
const StyledTouchableOpacity = styled(TouchableOpacity)`
    flex-direction: row;
    padding: 5px;
    align-items: center;
`;

const StyledText = styled(Text)`
    /* compensate alignment for icon size + set standard 10 px margin */
    marginLeft: ${props => props.compensateRightIcon ? 32 : 10};
    marginRight: ${props => props.compensateLeftIcon ? 32 : 10};

    /*
    without uppercase

    fontSize: 14;
    marginBottom: 2;
    */

    fontSize: 11;
    marginBottom: 1;
    text-transform: uppercase;

    color: ${props =>
        props.disabled ? colors.disabled :
        props.color === 'green' ? colors.green :
        props.color === 'blue' ? colors.blue :
        colors.default
    };
`;

const StyledIcon = styled(Icon)`
    color: ${props =>
        props.disabled ? colors.disabled :
        props.color === 'green' ? colors.green :
        props.color === 'blue' ? colors.blue :
        colors.default
    };

    /* Add padding, user had issues clicking on icon-only buttons. */
    paddingTop: 15;
    paddingRight: 15;
    paddingBottom: 15;
    paddingLeft: 15;
`;
/* eslint-enable indent */

// Components
const TextButton = ({
    children,
    onPress,
    icon,
    color = undefined,
    disabled = false,
    onLongPress = undefined,
    delayLongPress = undefined,
    accessibilityLabel = undefined
}: Props) => (
    <StyledTouchableOpacity
        accessibilityLabel={accessibilityLabel}

        color={color}
        disabled={disabled}

        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={delayLongPress}
    >
        {
            icon === 'prev' &&
            <StyledIcon
                disabled={disabled}
                type="Entypo"
                name="chevron-small-left"
            />
        }
        {
            typeof children !== 'undefined' &&
                <StyledText disabled={disabled} compensateLeftIcon={icon === 'prev'} compensateRightIcon={icon !== 'prev'}>
                    {children}
                </StyledText>
        }
        {
            icon === 'next' &&
            <StyledIcon
                disabled={disabled}
                type="Entypo"
                name="chevron-small-right"
            /> ||
            icon === 'ok' &&
            <StyledIcon
                disabled={disabled}
                type="Ionicons"
                name="ios-checkmark"
            />
        }
    </StyledTouchableOpacity>
);

export default TextButton;