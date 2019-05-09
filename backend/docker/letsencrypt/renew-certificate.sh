#!/bin/bash
#
# @note This script is automatically called by cron tab every night at 23:00
#       (see `generate-renewal-certificate-crontab.sh).
#
# @note `docker kill --signal=HUP aware-server_web` only send HUP / reload
#       config signal to the underlying nginx instance.

set -x
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

docker run --rm -it --name certbot \
    -v ${DIR}/data/etc/letsencrypt:/etc/letsencrypt \
    -v ${DIR}/data/var/lib/letsencrypt:/var/lib/letsencrypt \
    -v ${DIR}/data/var/log/letsencrypt:/var/log/letsencrypt \
    -v ${DIR}/webroot:/letsencrypt/webroot \
    certbot/certbot \
    renew --webroot \
    -w /letsencrypt/webroot --quiet && \
    docker restart aware-server_web_1

# seems not to be working, did `docker restart` instead:
# docker kill --signal=HUP aware-server_web_1


