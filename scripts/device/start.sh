#!/bin/bash

set -xe

adb -d shell monkey -p org.pnplab.flux 1
