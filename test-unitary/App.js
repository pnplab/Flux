/**
 * @format
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 *
 * @todo rename to integration
 * @todo rename integration to e2e/functional
 */

// Fixes `ReferenceError: You are trying to `import` a file after the Jest environment has been torn down.
// see `https://github.com/facebook/jest/issues/4359`
jest.useFakeTimers();

import 'react-native';
import React from 'react';
import App from '../App';

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

it('renders correctly', () => {
  renderer.create(<App />);
});
