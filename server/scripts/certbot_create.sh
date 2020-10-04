#!/bin/bash

DOMAIN="$1"
EMAIL="$2"

if [ -z "$DOMAIN" ] ||  [ -z "$EMAIL" ]; then
    echo "You must provide DOMAIN and EMAIL parameters" 1>&2
    exit 1
fi

# create certificates at
# /etc/letsencrypt/live/${DOMAIN}/privkey.pem 
# /etc/letsencrypt/live/${DOMAIN}/fullchain.pem 
# /etc/letsencrypt/live/${DOMAIN}/fullchain.pem 
# /etc/letsencrypt/live/${DOMAIN}/cert.pem 
sudo certbot certonly --standalone --preferred-challenges http --domain ${DOMAIN} --email ${EMAIL} --agree-tos --no-eff-email