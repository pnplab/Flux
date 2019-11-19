module.exports = {
    // plugins: [
    //     [
    //         // @note seems not to be working!
    //         //     "@babel/core": "7.3.3",
            
    //         "@babel/plugin-proposal-class-properties",
    //         {
    //             loose: true
    //         }
            
    //     ]
    // ],
    presets: [
        // "@babel/preset-flow", // @note not sure it's doing anything. everything works without (except flow logs are not shown). / ! Not set in default react-native config !
        'module:metro-react-native-babel-preset'
    ],
    plugins: [
        // babel@plugin-proposal-class-properties:
        //
        // The good: it fixes jest unit testing.
        // The bad: it breaks react native.
        //
        // Fixes `SyntaxError: <...>/node_modules/react-native/jest/mockComponent.js:
        // Support for the experimental syntax 'classProperties' isn't
        // currently enabled` when using jest. See
        // `https://github.com/facebook/react-native/issues/21075`. Also
        // fixes `Cannot read property 'default' of undefined [...] at new
        // Icon [...]` kind of errors cf. `https://github.com/facebook/react-native/issues/22437`.
        //
        // However, it comes with bug `YellowBoxList Error when starting:
        // TypeError: undefined is not an object (evaluating 'props.getItem')`.
        // cf. `https://github.com/facebook/react-native/issues/21154#issuecomment-439348692`.
        //
        // Adding `@babel/plugin-transform-flow-strip-types` _before_
        // `@babel/plugin-proposal-class-properties` has fixed both errors,
        // see `https://github.com/facebook/react-native/issues/21154#issuecomment-477958260`.
        '@babel/plugin-transform-flow-strip-types',
        '@babel/plugin-proposal-class-properties',

        // Transform your (developer's) env variables in plain string at
        // compile time so they can be kept readable in compiled source code
        // from the user's mobile app.
        [
            'transform-inline-environment-variables', {
                'include': [
                    'FLUX_AUTO_UPDATE',
                    'FLUX_ENCRYPTION_KEY',
                    'STUDY_URL',
                    'SYNCED_TABLES',
                    'CI_COMMIT_SHORT_SHA',
                    'BUGSNAG_API_KEY',
                    'SENTRY_DSN'
                ]
            }
        ]
    ]
};
