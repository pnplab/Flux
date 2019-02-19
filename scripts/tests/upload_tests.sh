#!/bin/bash

set -ex

echo "@note run package_tests.sh first."
echo "@warning First configure aws using \`aws configure\`."
echo "\tsee https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html"
echo "\tsee https://console.aws.amazon.com/iam for users credentials & configuration"

ARN=$(aws devicefarm list-projects | jq -r '.projects[0] .arn')
TEST_PATH="test-bundle.zip"
TEST_URL=$(aws devicefarm create-upload --project-arn ${ARN} --name test-bundle.zip --type APPIUM_NODE_TEST_PACKAGE | jq -r '.upload .url')
curl -T ${TEST_PATH} ${TEST_URL}
