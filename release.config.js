// Release workflow.
// We use single channel release workflow.
//
// Problem for multi-channel implementation:
// - There is a mismatch between APK's inner versionName and released git tag
//   because semantic-release tool is executed after android apk build. We
//   bypass this issue by relying on CI_PIPELINE_ID as androidCode but this
//   wouldn't work for multichannel as an integer is single-dimension.
// - Semantic-release tool's stable version doesn't handle multi channel
//   version (although perhaps hackable).
//
// Update system:
// 1. App opens.
// 2. Check wifi is on.
// 3. Last version.json downloaded from github.
// 4. Comparison over current android versionCode (embedded inside used apk)
//    and version.json versionCode. Both are set by [gitlab] CI_PIPELINE_ID.
//    @warning ANDROID_VERSION_NAME mismatches with release tag version as it's
//        defined before semantic-release process! We thus rely only on
//        ANDROID_VERSION_CODE only for upgrade comparison instead.
// 5. Propose update to user.
// 6. Bugsnag log the refused update.
//
// Build system concerns (for android version code comparison x version name):
// 1. Android build is triggered through continuous-integration/gitlab-ci.yml
//    w/ ANDROID_VERSION_CODE set from [gitlab] CI_PIPELINE_ID and
//    ANDROID_VERSION_NAME [gitlab] CI_COMMIT_REF_NAME.CI_COMMIT_SHORT_SHA
//    embedded into APK w/ CI_COMMIT_REF_NAME being branch or tag.
// 2. Once the build is done, user has the possibility to trigger a release.
// 3. If user trigger the build, semantic-release is triggered, generate the
//    new version and the corresponding github tag and release package.
// 4. Github now has a new release with version.json although APK inner
//    versionName doesn't contain version tag but previous branch + commit.
//
// Semantic-release (for flexible/multi-channel git tag/release publishment):
// Multi-channel release development have been developed in semantic-release
// since v16 alpha. *There is no final release yet and the documentation is
// conflicting.*
// cf. 2 years old draft: https://github.com/semantic-release/evolution/blob/release-workflows/_drafts/release-workflows.md#single-release-branch
// cf. To-date issue: https://github.com/semantic-release/semantic-release/issues/563
//
// Version server solution:
// We could use a version server to tell app which version to serve based on
// channel.
//
// Thus sementic-release multi-channel implementation req. to check source code
// as documentation as we have no other reliable source. And it's untested. We
// could also dynamically modify this current file with env variable.
//
// I have seen @semantic-release/github plugin to have an addChannel parameter
// to set tag postfixes although I can't find it anymore on doc (thus this has
// to be verified first for multi-channel git release/tag to work).

if (typeof process.env.ANDROID_VERSION_CODE === 'undefined') {
    console.error('missing process.env.ANDROID_VERSION_CODE in release.config.js');
    throw new Error('missing process.env.ANDROID_VERSION_CODE in release.config.js');
}

module.exports = {
    'branch': 'nuKs/dev',
    'repositoryUrl': 'https://github.com/pnplab/Flux.git',
    'plugins': [
        '@semantic-release/commit-analyzer',
        '@semantic-release/release-notes-generator',
        [
            '@semantic-release/changelog',
            {
                'changelogFile': 'docs/CHANGELOG.md'
            }
        ],
        [
            '@semantic-release/npm',
            {
                'npmPublish': false
            }
        ],
        [
            '@semantic-release/exec',
            {
                'prepareCmd':
                    `echo '{
                        "versionName": "\${nextRelease.version}",
                        "versionCode": ${process.env.ANDROID_VERSION_CODE},
                        "forceUpdate": true,
                        "apkUrl": "https://github.com/pnplab/Flux/releases/download/v\${nextRelease.version}/Flux.apk"
                    }' > android/version.json`
            }
        ],
        [
            '@semantic-release/github',
            {
                'assets': [
                    {
                        'path': 'Flux.apk',
                        'label': 'Android Application'
                    },
                    {
                        'path': 'docs/CHANGELOG.md'
                    },
                    {
                        'path': 'android/version.json',
                        'label': 'Continuous delivery package'
                    }
                ]
            }
        ]
    ]
};
