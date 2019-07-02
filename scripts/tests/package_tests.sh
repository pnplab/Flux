#!/bin/bash
#
# @note aws doc `https://docs.aws.amazon.com/devicefarm/latest/developerguide/how-to-create-test-run.html`

set -ex

echo "@warning make sure you have npm-bundle installed"
echo "@warning make sure SYNCED_TABLES variable is sourced"
echo -e "\t\`npm install -g npm-bundle\`"


# Remove temporary files if already exists.
# That only need to be done if script has crashed during execution (and thus hasn't been done at the end) 
rm -r test-package/ || true

# Copy minimal amount of file to run integration tests (so copy to aws device farm doesn't take too long)
mkdir test-package/
cp babel.config.js test-package/
# Remove all unrequired dependencies to reduce test bundle sent to aws device farm as much as possible (we
# still need react-native as the jest preset is located inside it).
# Put all the required devDependencies in dependencies as they wont be installed by npm through the npm-bundle
# otherwise.
cat package.json | jq '
{
    name,
    version,
    scripts: { test: "node node_modules/jest/bin/jest.js" },
    dependencies: {
        "react-native": .dependencies["react-native"],
        "@babel/core": .devDependencies["@babel/core"],
        "@babel/runtime": .devDependencies["@babel/runtime"],
        "@jest/reporters": .devDependencies["@jest/reporters"],
        "babel-plugin-transform-inline-environment-variables": .devDependencies["babel-plugin-transform-inline-environment-variables"],
        "jest": .devDependencies["jest"],
        "react-test-renderer": .devDependencies["react-test-renderer"],
        "wd": .devDependencies["wd"],
        "@react-native-community/cli": "2.0.0"
    },
    jest: .jest | del(.setupFilesAfterEnv?) | del(.preset)
}
' > test-package/package.json
mkdir test-package/__tests__/

# @warning wildcard is mandatory on CI for some reason. Not required on local
# implementation. Might be due to docker-alpine:3.9 incompatibility.
cp -R test-integration/* test-package/__tests__/

# Inect synced tables environment variable into tests.
# Remove newlines for sed.
SYNCED_TABLES_TR=`echo ${SYNCED_TABLES} | tr '\n' ' ' | tr '[' ' ' | tr ']' ' '`
sed -i -e "s/\/\* @SED_SYNCED_TABLES_FROM_ENV \*\//${SYNCED_TABLES_TR}/g" test-package/__tests__/*.spec.js

# Open folder
cd test-package/

# Install packages (as req. by device farm)
npm install

# Bundle packages (aws requires a .tgz inside a .zip)
TGZ_BUNDLE=$(npm-bundle)
ZIP_OUTPUT=test-bundle.zip
zip -r ${ZIP_OUTPUT} ${TGZ_BUNDLE}

# mkdir test-bundle
# mv ${TGZ_BUNDLE} test-bundle/
# zip -r ${ZIP_OUTPUT} test-bundle
# rm -r test-bundle/

# Cleanup
cd ../
mv test-package/${ZIP_OUTPUT} ./
rm -r test-package/
