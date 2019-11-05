/**
 * @flow
 */

// Full path is now required to mock react-native internal modules since rn 0.61 
// cf. `https://github.com/facebook/react-native/issues/26579#issuecomment-535765528`.
jest.mock('react-native/Libraries/PermissionsAndroid/PermissionsAndroid', () => {

    const PermissionsAndroid = require.requireActual('react-native/Libraries/PermissionsAndroid/PermissionsAndroid');

    return {
        ...PermissionsAndroid,
        check: async perm => true
    };

});