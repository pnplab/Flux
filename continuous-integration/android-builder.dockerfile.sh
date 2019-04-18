#!/bin/bash

set -ex

echo "@warning make sure you've run docker login first!"

docker build -t pnplab/ci.gitlab.react-native-android -f android-builder.dockerfile .
docker push pnplab/ci.gitlab.react-native-android:latest
