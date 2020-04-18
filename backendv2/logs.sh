#!/bin/bash

ssh -t root@192.99.152.104 'cd backendv2; docker-compose logs -f'
