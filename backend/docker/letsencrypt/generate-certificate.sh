#!/bin/bash
#
# Generate Let's Encrypt Certificate
#
# @pre     load `docker-compose up` so nginx is on
# 
# @warning Let's Encrypt only allows 5 certificate per week.
#          -> uncomment --staging line when testing

set -x
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

docker run -it --rm \
    -v ${DIR}/data/etc/letsencrypt:/etc/letsencrypt \
    -v ${DIR}/data/var/lib/letsencrypt:/var/lib/letsencrypt \
    -v ${DIR}/data/var/log/letsencrypt:/var/log/letsencrypt \
    -v ${DIR}/webroot:/letsencrypt/webroot \
    certbot/certbot \
    certonly --webroot \
    --email gse.nuks@gmail.com --agree-tos --no-eff-email \
    --webroot-path=/letsencrypt/webroot \
    -d pnplab.ca -d www.pnplab.ca
    # --staging \
