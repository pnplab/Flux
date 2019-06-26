#!/bin/bash
set -ex

# @warning the cd backend/ seems important as it seems `--exclude-from` will
# take the current `pwd` to prepend the .gitignore file patterns.

cd backend;
rsync -avzh --exclude-from=.gitignore ./ root@pnplab.ca:~/aware-server
cd ..
