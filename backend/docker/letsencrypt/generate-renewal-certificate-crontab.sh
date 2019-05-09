#!/bin/bash
#
# Set up the cron tab to regenerate .
#
# @pre `${DIR}/renew-certificate.sh` script must exists
#

set -x
# set -e @warning exit on `crontab -l 2>/dev/null`

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

(crontab -l 2>/dev/null; echo -e "0 23 * * * ${DIR}/renew-certificate.sh\n") | crontab -
