/**
 * React Native entry point. Registers the root component with
 * AppRegistry - this file is deliberately minimal and stable; it should
 * rarely change even as `src/app/App.tsx` grows.
 */
import { AppRegistry } from 'react-native';

import { App } from './src/app/App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
