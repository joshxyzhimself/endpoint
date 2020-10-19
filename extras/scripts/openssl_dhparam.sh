#!/bin/bash

DOMAIN="$1"

if [ -z "$DOMAIN" ]; then
    echo "You must provide DOMAIN" 1>&2
    exit 1
fi

# create dhparam at
# /etc/letsencrypt/live/${DOMAIN}/dhparam.pem
mkdir -p /etc/letsencrypt/live/${DOMAIN}/
openssl dhparam -outform PEM -out /etc/letsencrypt/live/${DOMAIN}/dhparam.pem 2048