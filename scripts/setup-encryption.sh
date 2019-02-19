#!/bin/bash

set -xe

if [ -z "$1" ]; then
    echo "Please set the encryption key as first parameter";
    exit -1;
else
    echo "Encryption key set: ${1}"
fi

# Set up encryption key in android

KEY=${1}

sed -i -e "s/\/\*@db_encryption_key@\*\//${KEY}/g" android/app/src/main/java/org/pnplab/flux/AwareManagerModule.java
rm android/app/src/main/java/org/pnplab/flux/AwareManagerModule.java-e

# Set up encryption key in ios (todo)
