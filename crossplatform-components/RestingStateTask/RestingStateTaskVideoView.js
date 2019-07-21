/*
 * @flow
 */

import React from 'react';
import { View, StatusBar } from 'react-native';

import styled from 'styled-components';
import Video from 'react-native-video';

type Props = {
    +onVideoStreamStarted: () => void,
    +onVideoStreamFinished: () => void,
    +onVideoLoadingError: () => void
};

const RestingStateTaskVideoView = (props: Props) =>
    <Wrapper>
        <StatusBar hidden={true} />
        <Video
            source={require('../../assets/resting-state.mp4')}
            volume={0.0} // 0 is muted, 1 is normal.
            paused={false}
            onLoad={props.onVideoStreamStarted} // Callback when playback starts
            onEnd={props.onVideoStreamFinished} // Callback when playback finishes
            onError={props.onVideoLoadingError} // Callback when video cannot be loaded
            resizeMode="cover"

            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                right: 0
            }}
        />
    </Wrapper>;

const Wrapper = styled(View)`
        flex: 1;
    `;

export default RestingStateTaskVideoView;