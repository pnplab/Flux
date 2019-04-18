#!/bin/bash

set -e

# Process args
QUIET="false"
DEVICE_POOL_NAME="Android Fast"
while getopts 'qp:' flag; do
    case "${flag}" in
        q) QUIET="true" ;;
        p) DEVICE_POOL_NAME="${OPTARG}" ;;
        :) >&2 echo "Missing option argument for -$OPTARG"; exit 1;;
        *) >&2 echo "Unimplemented option: -$OPTARG"; exit 1;;
    esac
done

# Print doc
if [ "${QUIET}" = "false" ]; then
    echo "[-q] only show final arn"
    echo "[-p:string] device pool name - default: \"Android Fast\""
    echo "@note run package_tests.sh first."
    echo "@warning First configure aws using \`aws configure\`."
    echo -e "\tsee https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html"
    echo -e "\tsee https://console.aws.amazon.com/iam for users credentials & configuration"
    echo -e "\n"
fi

# Schedule test run
PROJ_ARN=$(aws devicefarm list-projects | jq -r '.projects[0] .arn')
DEVICES_ARN=$(aws devicefarm list-device-pools --arn ${PROJ_ARN} | jq -r ".devicePools | .[] | select(.name == "'"'"${DEVICE_POOL_NAME}"'"'") | .arn")
APP_ARN=$(aws devicefarm list-uploads --arn ${PROJ_ARN} --type ANDROID_APP | jq -r '.uploads | sort_by(.created) | reverse | .[0] .arn')
TESTS_ARN=$(aws devicefarm list-uploads --arn ${PROJ_ARN} --type APPIUM_NODE_TEST_PACKAGE | jq -r '.uploads | sort_by(.created) | reverse | .[0] .arn')
CONF_ARN=$(aws devicefarm list-uploads --arn ${PROJ_ARN} --type APPIUM_NODE_TEST_SPEC | jq -r '.uploads | sort_by(.created) | reverse | .[0] .arn')
RUN_NAME=MySuperScript

JSON=`aws devicefarm schedule-run --project-arn ${PROJ_ARN} --app-arn ${APP_ARN} --device-pool-arn ${DEVICES_ARN} --name ${RUN_NAME} --test testSpecArn=${CONF_ARN},type=APPIUM_NODE,testPackageArn=${TESTS_ARN}`
if [ "${QUIET}" = "false" ]; then
    echo ${JSON} | jq
else
    echo ${JSON} | jq -r '.run.arn'
fi
