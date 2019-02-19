#!/bin/bash

set -ex

echo "@note run package_tests.sh first."
echo "@warning First configure aws using \`aws configure\`."
echo "\tsee https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html"
echo "\tsee https://console.aws.amazon.com/iam for users credentials & configuration"

PROJ_ARN=$(aws devicefarm list-projects | jq -r '.projects[0] .arn')
DEVICE_POOL_NAME=${1:-"Android Fast"}
DEVICES_ARN=$(aws devicefarm list-device-pools --arn ${PROJ_ARN} | jq -r ".devicePools | .[] | select(.name == "'"'"${DEVICE_POOL_NAME}"'"'") | .arn")
APP_ARN=$(aws devicefarm list-uploads --arn ${PROJ_ARN} --type ANDROID_APP | jq -r '.uploads | sort_by(.created) | reverse | .[0] .arn')
TESTS_ARN=$(aws devicefarm list-uploads --arn ${PROJ_ARN} --type APPIUM_NODE_TEST_PACKAGE | jq -r '.uploads | sort_by(.created) | reverse | .[0] .arn')
CONF_ARN=$(aws devicefarm list-uploads --arn ${PROJ_ARN} --type APPIUM_NODE_TEST_SPEC | jq -r '.uploads | sort_by(.created) | reverse | .[0] .arn')

RUN_NAME=MySuperScript

aws devicefarm schedule-run --project-arn ${PROJ_ARN} --app-arn ${APP_ARN} --device-pool-arn ${DEVICES_ARN} --name ${RUN_NAME} --test testSpecArn=${CONF_ARN},type=APPIUM_NODE,testPackageArn=${TESTS_ARN} | jq
