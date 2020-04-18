#!/bin/bash
set -ex

ssh root@192.99.152.104 'cd backendv2; docker-compose down; docker-compose up -d --build'
