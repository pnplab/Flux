#!/bin/bash
set -ex

echo -e "@warning Build a release version of the app first"
echo -e "@warning Start appium manually"

# Cleanup previous installation if any.
rm -r ../test-dmz || true

# Create deadmanzone outside this folder for this standalone test environment.
mkdir ../test-dmz
cp test-bundle.zip ../test-dmz/
cd ../test-dmz/

# Install Flux npm bundle package.
unzip test-bundle.zip
rm test-bundle.zip
npm install *.tgz

# Clean up.
rm *.tgz
rm package-lock.json

# Move Flux out of node_modules/ structure because npm will check up
# recursively back and having nested node_modules will mess with jest!
mv node_modules tmp_to_remove
mv tmp_to_remove/Flux/* ./
rm -r tmp_to_remove

# Install deps.
yarn

# Clean up emulator env
adb uninstall org.pnplab.flux || true
rm -r /Users/medullosuprarenal/Documents/_eeg/pristine/build/release/ || true
cp -r ../Flux/android/app/build/outputs/apk/release/ /Users/medullosuprarenal/Documents/_eeg/pristine/build/release/

# Run tests.
jest
