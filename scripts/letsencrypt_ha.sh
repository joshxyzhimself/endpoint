#!/bin/bash

if [ $# -lt 1 ]; then
    echo "Error: at least one (1) DOMAIN parameter is required." >&2
    exit 1
fi

certbot_path=$(command -v certbot);
echo "==================== certbot_path ${certbot_path}"
haproxy_path=$(command -v haproxy);
echo "==================== haproxy_path ${haproxy_path}"

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

if [ ! -x "$haproxy_path" ]; then
    echo
    echo "==================== INSTALL HAPROXY"
    apt update
    apt install haproxy -y
    echo "Installed: haproxy"
fi

if [ -x "$haproxy_path" ]; then
    echo
    echo "==================== STOP HAPROXY"
    systemctl stop haproxy
    echo "Stopped: haproxy"
fi

if [ -x "$haproxy_path" ]; then
    echo
    echo "==================== HAPROXY TLS DIR"
    mkdir -p /etc/haproxy/tls/
    echo "Created: /etc/haproxy/tls/"
fi

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
    if [ -x "$haproxy_path" ]; then
        cat /etc/letsencrypt/live/${DOMAIN}/fullchain.pem /etc/letsencrypt/live/${DOMAIN}/privkey.pem > /etc/haproxy/tls/${DOMAIN}.pem
        echo "Created /etc/haproxy/tls/${DOMAIN}.pem"
    fi
done

if ! [ -f "/etc/haproxy/tls/dhparam.pem" ]; then
    echo
    echo "==================== CREATE DHPARAM"
    openssl dhparam -outform PEM -out /etc/haproxy/tls/dhparam.pem 2048
    echo "Created: /etc/haproxy/tls/dhparam.pem"
fi

if [ -x "$haproxy_path" ]; then
    echo
    echo "==================== START HAPROXY"
    systemctl start haproxy
    echo "Started: haproxy"
    echo "Usage: bind *:443 ssl crt /etc/haproxy/tls/"
    echo "Usage: https://serverfault.com/a/937946"
fi