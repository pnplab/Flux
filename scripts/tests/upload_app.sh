#!/bin/bash

set -ex

echo "@note Build app first"
echo "@warning First configure aws using \`aws configure\`."
echo "\tsee https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html"
echo "\tsee https://console.aws.amazon.com/iam for users credentials & configuration"

ARN=$(aws devicefarm list-projects | jq -r '.projects[0] .arn')
APP_PATH="/Users/medullosuprarenal/Documents/_eeg/pristine/Flux/android/app/build/outputs/apk/release/app-universal-release.apk"
APP_URL=$(aws devicefarm create-upload --project-arn ${ARN} --name app-universal-release.apk --type ANDROID_APP | jq -r '.upload .url')
curl -T ${APP_PATH} ${APP_URL}


