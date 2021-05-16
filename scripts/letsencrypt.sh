#!/bin/bash

if [ $# -lt 1 ]; then
    echo "Error: at least one (1) DOMAIN parameter is required." >&2
    exit 1
fi

certbot_path=$(command -v certbot);
echo "==================== certbot_path ${certbot_path}"

if [ ! -x "$certbot_path" ]; then
    echo
    echo "==================== INSTALL CERTBOT"
    apt update
    apt install software-properties-common
    add-apt-repository -y universe
    apt update
    apt install certbot -y
    echo "Installed: certbot"
fi

echo
echo "==================== TLS DIR"
mkdir -p /etc/tls/
echo "Created: /etc/tls/"
mkdir -p /etc/tls/haproxy/
echo "Created: /etc/tls/haproxy/"

for DOMAIN in "$@"
do
    echo
    echo "==================== DOMAIN: ${DOMAIN}"
    mkdir -p /etc/letsencrypt/live/${DOMAIN}/
    echo "Created: /etc/letsencrypt/live/${DOMAIN}/"
    sudo certbot certonly --standalone --noninteractive --preferred-challenges http --domain ${DOMAIN} --register-unsafely-without-email --quiet
    echo "Created: /etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
    echo "Created: /etc/letsencrypt/live/${DOMAIN}/privkey.pem"
    echo "Created: /etc/letsencrypt/live/${DOMAIN}/cert.pem"
    cat /etc/letsencrypt/live/${DOMAIN}/fullchain.pem /etc/letsencrypt/live/${DOMAIN}/privkey.pem > /etc/tls/haproxy/${DOMAIN}.pem
    echo "Created /etc/tls/haproxy/${DOMAIN}.pem"
done

if ! [ -f "/etc/tls/dhparam.pem" ]; then
    echo
    echo "==================== CREATE DHPARAM"
    openssl dhparam -outform PEM -out /etc/tls/dhparam.pem 2048
    echo "Created: /etc/tls/dhparam.pem"
fi