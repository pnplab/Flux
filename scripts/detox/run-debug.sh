#!/bin/sh

# See https://github.com/wix/detox/issues/830
detox build -c android.emu.debug && mkdir -p android/app/build/outputs/androidTest/universal/debug && mv android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk android/app/build/outputs/androidTest/universal/debug/app-universal-debug-androidTest.apk && detox test -c android.emu.debug -l verbose --debug-synchronization 2000
