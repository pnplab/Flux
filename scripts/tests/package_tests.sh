#!/bin/bash
#
# @note aws doc `https://docs.aws.amazon.com/devicefarm/latest/developerguide/how-to-create-test-run.html`

set -e

echo "@warning make sure you have npm-bundle installed"
echo -e "\t\`npm install -g npm-bundle\`"

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
        "babel-core": .devDependencies["babel-core"],
        "babel-jest": .devDependencies["babel-jest"],
        "jest": .devDependencies["jest"],
        "react-test-renderer": .devDependencies["react-test-renderer"],
        "wd": .devDependencies["wd"]
    },
    jest: .jest | del(.setupFilesAfterEnv?)
}
' > test-package/package.json
mkdir test-package/__tests__/
cp -R test-integration/ test-package/__tests__/

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
