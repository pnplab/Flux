#!/bin/bash
set -ex

echo -e '@warning make sure you already have public key or run \`ssh-keygen\`'

ssh-copy-id -i ~/.ssh/id_rsa.pub root@pnplab.ca
