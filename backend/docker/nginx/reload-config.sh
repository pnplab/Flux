#!/bin/bash

set -x
set -e

docker kill --signal=HUP aware-server_web_1