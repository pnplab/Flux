#!/bin/bash
set -ex

# @warning the cd backendv2/ seems important as it seems `--exclude-from` will
# take the current `pwd` to prepend the .gitignore file patterns.

#cd backendv2;
rsync -avzh --exclude-from=.gitignore ./ root@192.99.152.104:/root/backendv2
#cd ..
