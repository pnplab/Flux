#!/bin/bash

set -x
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

openssl dhparam -out ${DIR}/dhparam-2048.pem 2048

