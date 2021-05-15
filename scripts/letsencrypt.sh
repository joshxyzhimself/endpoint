#!/bin/bash

DOMAIN="$1"

if [ -z "$DOMAIN" ]; then
    echo "Error: DOMAIN parameter required." >&2
    exit 1
fi

if ! [ -x "$(command -v certbot --version)" ]; then
    apt-get update
    apt-get install software-properties-common
    add-apt-repository -y universe
    apt-get update
    apt-get install certbot -y
    echo "Installed: certbot"
fi

systemctl stop haproxy
echo "Stopping: haproxy"

mkdir -p /etc/letsencrypt/live/${DOMAIN}/
echo "Created: /etc/letsencrypt/live/${DOMAIN}/"

sudo certbot certonly --standalone --noninteractive --preferred-challenges http --domain ${DOMAIN} --email admin@${DOMAIN} --agree-tos --no-eff-email
echo "Created: /etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
echo "Created: /etc/letsencrypt/live/${DOMAIN}/privkey.pem"
echo "Created: /etc/letsencrypt/live/${DOMAIN}/cert.pem"

mkdir -p /etc/haproxy/tls/
echo "Created: /etc/haproxy/tls/"

cat /etc/letsencrypt/live/${DOMAIN}/fullchain.pem /etc/letsencrypt/live/${DOMAIN}/privkey.pem > /etc/haproxy/tls/${DOMAIN}.pem
echo "Created /etc/haproxy/tls/${DOMAIN}.pem"
echo "Usage: bind *:443 ssl crt /etc/haproxy/tls/"
echo "Usage: https://serverfault.com/a/937946"

if ! [ -f "/etc/haproxy/tls/dhparam.pem" ]; then
    openssl dhparam -outform PEM -out /etc/haproxy/tls/dhparam.pem 2048
    echo "Created: /etc/haproxy/tls/dhparam.pem"
fi

systemctl start haproxy
echo "Starting: haproxy"