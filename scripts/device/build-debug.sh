#!/bin/bash

set -xe

react-native run-android --variant=debug --deviceId $(adb devices | head -n 2 | tail -n 1 | awk '{ print $1 }')
adb -d install android/app/build/outputs/apk/debug/app-universal-debug.apk
adb -d shell monkey -p org.pnplab.flux 1

