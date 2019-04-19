/**
 * React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */

import React, { Component } from 'react';
import { StatusBar, Alert } from 'react-native';
import { Provider } from 'react-redux';
import { StyleProvider } from 'native-base';

import AwareManager from './crossplatform-model/native-db/AwareManager';
import { store } from './crossplatform-model/memory-db';
import { getTheme } from './crossplatform-theme/';

import Router from './crossplatform-components/Router';
import { triggerUpdateIfNeeded } from './Updater.js';

// -- About routing
//
// @note *We do not use router*, instead we only use redux to avoid having
//         multiple source of thruth, as we've faced the same challenges
//         referenced in
//         `https://stackoverflow.com/questions/48893490/react-router-vs-redux-first-routing`
//         in a previous version of the source code. We use a framework similar
//         to the one mentioned in this article
//         `https://medium.freecodecamp.org/an-introduction-to-the-redux-first-routing-model-98926ebf53cb`,
//         although no the same one, as the one we use has a higher community
//         spread & is compatible with react-native such as it doesn't
//         necessarily rely on browser history, but can rely on mobile native
//         mechanism for backward/forward navigation instead. See
//         `https://github.com/respond-framework/rudy/blob/master/packages/rudy/docs/react-native.md`.
// 
// @warning Rudy's documentation (the redux router) is partly out of date.

// -- About theme and components
// 
// @note We use native-base-theme library modified to use iOS style theme on
//         both android & ios. The native-base-theme's theme is located in the
//         `./crossplatform/theme` folder.


type Props = {};

export default class App extends Component<Props> {
    render() {
        return (
            <StyleProvider style={getTheme()}>
                <Provider store={store}>
                    <StatusBar backgroundColor="#FAFAFA" barStyle="dark-content" />
                    <Router></Router>
                </Provider>
            </StyleProvider>
        );
    }
}

// @note `AwareManager.startAware()` is set in the StudySchemaAdapter
// @todo rename StudySchemaAdapter to InitAppSchemaAdapter.

// Add aware-related debugging tools to dev menu
if (__DEV__ || !__DEV__) {
    const DevMenu = require('react-native-dev-menu');

    DevMenu.addItem('aware: device id', async () => {
        let deviceId = await AwareManager.getDeviceId();

        Alert.alert(
          'AWARE Device ID',
          deviceId,
          [
            { text: 'OK' },
          ],
        );

    });

    DevMenu.addItem('aware: sync', () => AwareManager.syncData());
}

// Automatically update the app when released
if (typeof process.env.FLUX_AUTO_UPDATE !== 'undefined' && process.env.FLUX_AUTO_UPDATE == true) {
    triggerUpdateIfNeeded();
}
