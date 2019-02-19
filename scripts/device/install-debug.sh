#!/bin/bash

set -xe

adb -d install android/app/build/outputs/apk/debug/app-universal-debug.apk
adb -d shell monkey -p org.pnplab.flux 1

