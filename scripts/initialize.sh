#!/bin/bash

DOMAIN="$1"

if [ -z "$DOMAIN" ]; then
    echo "You must provide the DOMAIN parameter." >&2
    exit 1
fi

if ! [ -x "$(command -v certbot --version)" ]; then
    apt-get update
    apt-get install software-properties-common
    add-apt-repository -y universe
    apt-get update
    apt-get install certbot -y
fi

mkdir -p /etc/letsencrypt/live/${DOMAIN}/

sudo certbot certonly --standalone --noninteractive --preferred-challenges http --domain ${DOMAIN} --email admin@${DOMAIN} --agree-tos --no-eff-email

echo "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
echo "/etc/letsencrypt/live/${DOMAIN}/privkey.pem"
echo "/etc/letsencrypt/live/${DOMAIN}/cert.pem"

cat /etc/letsencrypt/live/${DOMAIN}/fullchain.pem /etc/letsencrypt/live/${DOMAIN}/privkey.pem > /etc/letsencrypt/live/${DOMAIN}/haproxy.pem

echo "/etc/letsencrypt/live/${DOMAIN}/haproxy.pem"

if ! [ -f "/etc/letsencrypt/live/${DOMAIN}/dhparam.pem" ]; then
    openssl dhparam -outform PEM -out /etc/letsencrypt/live/${DOMAIN}/dhparam.pem 2048
fi

echo "/etc/letsencrypt/live/${DOMAIN}/dhparam.pem"
