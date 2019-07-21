#!/bin/sh

# yarn release;
# appium;

adb -d uninstall org.pnplab.flux
yarn release:install
yarn test # !! make sure it's configured to use device and release and auto-app removal is disabled

# test being executed...
# app exit through appium...

# call
#
# adb -d shell am start -a android.intent.action.CALL -d tel:555-5555

# send sms
#
# Android 5 and older (here android 4):
# adb -d shell service call isms 5 s16 "com.android.mms" s16 "+01234567890" s16 "+01SMSCNUMBER" s16 "Hello world !" i32 0 i32 0
#
# Android 5 and later (here android 9):
# adb -d shell service call isms 7 i32 0 s16 "com.android.mms.service" s16 "+1234567890" s16 "null" s16 "Hey\ you\ !" s16 "null" s16 "null"
# 
# Other way
# adb -d shell am start -a android.intent.action.SENDTO -d sms:CCXXXXXXXXXX --es sms_body "SMS BODY GOES HERE" --ez exit_on_sent true
# adb -d shell input keyevent 22
# adb -d shell input keyevent 66

# Reboot phone
adb -d reboot

# Ensure everything is working fine w/ intent ??



