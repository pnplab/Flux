#!/bin/bash

echo "Temporarily fix Java paths for Appium Android";
echo "@warning Running this script will do nothing. it's meant to be sourced instead."
echo -e "\t. ../path-to-script.sh"

export JAVA_HOME=$(/usr/libexec/java_home)
export PATH=${JAVA_HOME}/bin:$PATH
