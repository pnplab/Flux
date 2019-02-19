#!/bin/bash

${ANDROID_SDK_ROOT}/platform-tools/systrace/systrace.py --time=${1:-10} -o trace.html sched gfx view -a org.pnplab.flux
