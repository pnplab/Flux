#!/bin/bash
set -ex

rsync -avzh --exclude-from=./backend/.gitignore ./backend/ root@pnplab.ca:~/aware-server
