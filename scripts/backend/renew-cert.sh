#!/bin/bash
set -ex

ssh root@pnplab.ca 'cd aware-server; ./docker/letsencrypt/renew-certificate.sh'
