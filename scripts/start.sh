#!/bin/bash
#
# Doc file to start react native development, commands need to be run in the 
# react app folder (Flux/).

set -ex

react-native start;

# either (for emulator + debug):
# - $(which emulator) -list-avds
# - $(which emulator) -avd "Nexus_5X_API_27" &
# - react-native run-android
# - react-native run-ios 
#
# or (for devices + release):
# - react-native run-android --variant=release --deviceId 5505a915
# - react-native run-ios --configuration Release --device


