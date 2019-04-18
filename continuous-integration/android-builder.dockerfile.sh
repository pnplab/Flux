#!/bin/bash

set -ex

echo "@warning make sure you've run \`docker login registry.gitlab.com\` first!"

docker build -t pnplab/ci.gitlab.react-native-android -f android-builder.dockerfile .

# Push onto dockerhub
# docker push pnplab/ci.gitlab.react-native-android:latest

# Push onto gitlab registry
docker tag pnplab/ci.gitlab.react-native-android:latest registry.gitlab.com/pnplab/flux/android-builder:latest
docker push registry.gitlab.com/pnplab/flux/android-builder:latest
