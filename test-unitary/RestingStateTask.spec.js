/**
 * @flow
 * @format
 */

import 'react-native';
import React from 'react';
import Home from '../crossplatform-components/Home';

import { render, fireEvent } from 'react-native-testing-library';

// Fixes `ReferenceError: You are trying to `import` a file after the Jest
// environment has been torn down.` 
// see `https://github.com/facebook/jest/issues/4359`.
jest.useFakeTimers();

xdescribe.only('RestingStateTask', () => {

    describe('Preparation', () => {

        it('should display the menu', () => {
        });

    });

    describe('Video', () => {

        it('should not display the menu', () => {
        });

    });

});