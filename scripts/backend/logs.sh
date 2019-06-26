#!/bin/bash

ssh -t root@pnplab.ca 'cd aware-server; docker-compose logs -f'
