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
        "module:metro-react-native-babel-preset"
    ],
    plugins: [
        ["transform-inline-environment-variables", {
            "include": [
                "FLUX_AUTO_UPDATE",
                "FLUX_ENCRYPTION_KEY",
                "STUDY_URL"
            ]
        }]
    ]
}
