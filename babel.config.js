module.exports = {
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
        ],

        // Uses babel-plugin-inline-import to be able to embedd svg files as
        // text in react-native-svg.
        // cf. https://github.com/react-native-community/react-native-svg/tree/29dd8a43dff0d6ebfb96d3266f679120062b7dbf#use-with-svg-files
        //
        // Tried react-native-svg-uri-reborn first with something like
        // <SVG width="100" height="100" source={require('./undraw_Security_on_ff2u.svg')} />
        //
        // However, [ANDROID] There is a problem with static SVG file on
        // Android, Works OK in debug mode but fails to load the file in
        // release mode. At the moment the only workaround is to pass the svg
        // content in the svgXmlData prop.
        // cf. https://github.com/MrDatastorage/react-native-svg-uri-reborn#readme
        //
        // Although these issues are from the forked repo (not the new one),
        // svg files with class perhaps don't work (undraw doesn't rely on classes).
        // cf. https://github.com/vault-development/react-native-svg-uri/issues/98
        // svg files with opacity don't seem to work (undraw rely on opacity).
        // cf. https://github.com/vault-development/react-native-svg-uri/issues/107
        //
        // Also, didn't allow rescaling for instance with KeyboardAvoidingView
        // use cases.
        //
        // Tried to embed svg in a font using https://glyphter.com/, however
        // it only accept grayscale fonts.
        //
        // Only way left is https://github.com/react-native-community/react-native-svg/
        // with modification to build system.
        //
        // Found underhood https://github.com/smooth-code/svgr in the meanwhile.
        // cf. https://github.com/react-native-community/react-native-svg/issues/900#issuecomment-472079313
        // Didn't work, needed preprocess https://jakearchibald.github.io/svgomg/
        // cf. https://github.com/react-native-community/react-native-svg/issues/1084#issuecomment-527150671
        // Didn't work either, indeed svgr converts to react (not react-native)
        // code and thus uses HTML svg code instead of react-native-svg one.
        [
            'babel-plugin-inline-import',
            {
                'extensions': ['.svg']
            }
        ]

    ]
};
