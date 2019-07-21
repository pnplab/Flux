/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import BugReporter from './crossplatform-model/native-db/BugReporter';

BugReporter.breadcrumb('App opened', 'log');

AppRegistry.registerComponent(appName, () => App);
