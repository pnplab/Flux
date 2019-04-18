#!/bin/bash

set -e

echo "@warning First configure aws using \`aws configure\`."
echo -e "\tsee https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html"
echo -e "\tsee https://console.aws.amazon.com/iam for users credentials & configuration"

ARN=$(aws devicefarm list-projects | jq -r '.projects[0] .arn')
DIR=$(dirname "$(realpath $0)")
YAML_PATH=${DIR}/devicefarm_appium_node.yaml

YAML_URL=$(aws devicefarm create-upload --project-arn ${ARN} --name devicefarm_appium_node.yaml --type APPIUM_NODE_TEST_SPEC | jq -r '.upload .url')
curl -T ${YAML_PATH} ${YAML_URL}
