/*
 * @flow
 */

import React from 'react';
import { View } from 'react-native';

import styled from 'styled-components';

import LinearGradient from 'react-native-linear-gradient';
import { Text, Button } from '../../crossplatform-theme/pnplab-components';
import Layout from '../Layout';
import LottieView from 'lottie-react-native';

type Props = {
    +isSurveyTaskAvailable: boolean,
    +isRestingStateTaskAvailable: boolean,
    +onStartSurveyTaskClicked: () => void,
    +onOpenRestingStateTaskClicked: () => void
};

// @note props.isSurveyTaskAvailable is undefined when local db is still
// loading.
const HomeView = (props: Props) => 
    <Layout>
        {/* <LinearGradient_> */}
        <View style={{position: 'relative', flex: 1, justifyContent: 'center', alignItems: 'center', }}>
            <TextWrapper>
                {!props.isSurveyTaskAvailable && !props.isRestingStateTaskAvailable &&
                    <>
                    <Text>Le test n'est pas disponible pour le moment.</Text>
                    <Text>Revenez plus tard.</Text>
                    </>
                || props.isSurveyTaskAvailable &&
                    <Text>Le test est disponible.</Text>
                || props.isRestingStateTaskAvailable &&
                    <Text>La tâche est disponible.</Text>
                }
            </TextWrapper>
            {!props.isSurveyTaskAvailable && !props.isRestingStateTaskAvailable &&
                <LottieView
                    style={{ marginTop: 75, marginLeft: 30, marginRight: 30 }}
                    source={require('./3165-loader.json')}
                    autoPlay
                    loop
                />
            ||
                <LottieView
                    style={{ margin: 30 }}
                    source={require('./2843-mobile-app.json')}
                    autoPlay
                    loop
                />
            }
            <StartTaskButtonWrapper>
                {props.isSurveyTaskAvailable &&
                    <Button icon="arrow-dropright-circle" onPress={e => props.onStartSurveyTaskClicked()}>
                        COMMENCER
                    </Button>
                }
                {props.isRestingStateTaskAvailable &&
                    <Button icon="arrow-dropright-circle" onPress={e => props.onOpenRestingStateTaskClicked()}>
                        COMMENCER
                    </Button>
                }
            </StartTaskButtonWrapper>
        </View>
        {/* </LinearGradient_> */}
    </Layout>;

// Grayscale gradient.
const LinearGradient_ = styled(LinearGradient).attrs(
    {
        colors: ['#EEE', '#FFF', '#FFF', '#FFF', '#EEE']
    }
    )`
        position: relative;
        flex: 1;

        /* center content */
        flex-direction: column;
        justify-content: center;
        align-items: center;
    `;

// Wrapper to position the text relatively to the main linear gradient view.
const TextWrapper = styled(View)`
    position: absolute;
    width: 100%;
    top: 100px;
`;

// Wrapper to position the button relatively to the main linear gradient view.
const StartTaskButtonWrapper = styled(View)`
    position: absolute;
    bottom: 80px;
    width: 70%;
`;

export default HomeView;