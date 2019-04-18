#!/bin/bash

set -ex

echo "@warning make sure you've run \`docker login registry.gitlab.com\` first!"

docker build -t pnplab/ci.gitlab.ci.gitlab.aws-device-farm:latest -f test-farm-runner.dockerfile .

# Push onto dockerhub
# docker push pnplab/ci.gitlab.ci.gitlab.aws-device-farm:latest

# Push onto gitlab registry
docker tag pnplab/ci.gitlab.ci.gitlab.aws-device-farm:latest registry.gitlab.com/pnplab/flux/test-farm-runner:latest
docker push registry.gitlab.com/pnplab/flux/test-farm-runner:latest
