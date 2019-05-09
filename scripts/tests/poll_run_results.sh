#!/bin/bash

set -e

QUIET="false"
RUN_ARN=""

# Process args
while getopts 'qa:' flag; do
    case "${flag}" in
        q) QUIET="true" ;;
        a) RUN_ARN="${OPTARG}" ;;
        :) >&2 echo "Missing option argument for -$OPTARG"; exit 1;;
        *) >&2 echo "Unimplemented option: -$OPTARG"; exit 1;;
    esac
done

# Print args
if [ "${QUIET}" != "true" ]; then
    echo "[-q] quiet - only echo \`PASSED\`, \`FAILED\` or \`TIMEOUT\`"
    echo "-a:string aws run arn"
    echo "@warning First configure aws using \`aws configure\`."
    echo -e "\tsee https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html"
    echo -e "\tsee https://console.aws.amazon.com/iam for users credentials & configuration"
    echo -e "\n"
fi

# Checkup missing args
if [ "${RUN_ARN}" = "" ]; then
    >&2 echo "Missing -a flag"
    exit 1
fi

# Poll run result every 30s for 15minutes from aws device farm
INTERVAL=30 # 30s
TIMEOUT=60*30 # 30min
((END_TIME=${SECONDS}+${TIMEOUT}))
while ((${SECONDS} < ${END_TIME}))
do
    # Retrieve current status
    RETURN=`aws devicefarm get-run --arn ${RUN_ARN}`
    RESULT=`echo ${RETURN} | jq -r '.run .result'`
    case "$RESULT" in
        PASSED)
            # PASSED !
            if [ "${QUIET}" = "true" ]; then
                echo "PASSED"
            else
                echo -e "${RETURN}"
            fi
            exit 0
            ;;
        PENDING)
            # No result yet, continue till next poll.
            if [ "${QUIET}" = "false" ]; then
                echo "PENDING..."
            fi
            sleep ${INTERVAL}
            ;;
        *)
            # Most likely FAILED, or STOPPED, WARNED, ...
            if [ "${QUIET}" = "true" ]; then
                echo "FAILED"
            else
                echo -e "${RETURN}"
            fi
            exit 2
    esac
done

# Timeout if we didn't return any result yet.
echo "TIMEOUT"
exit 3
