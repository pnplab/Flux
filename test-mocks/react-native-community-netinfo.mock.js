/**
 * @flow
 * 
 * cf. `https://github.com/react-native-community/react-native-netinfo/issues/75`
 */

jest.mock('@react-native-community/netinfo', () => {
    return {
        getCurrentConnectivity: jest.fn(),
        isConnectionMetered: jest.fn(),
        addListener: jest.fn(),
        removeListeners: jest.fn(),
        isConnected: {
            fetch: () => {
                return Promise.resolve(true);
            },
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
        },
    };
});