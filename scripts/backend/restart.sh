#!/bin/bash
set -ex

ssh root@pnplab.ca 'source prod.env; cd aware-server; docker-compose down; docker-compose up -d --build'
