
## Overview

- Installs certbot
- Creates /etc/tls/
- Creates /etc/tls/haproxy/
- Creates /etc/letsencrypt/live/${DOMAIN}/
- Creates /etc/letsencrypt/live/${DOMAIN}/fullchain.pem
- Creates /etc/letsencrypt/live/${DOMAIN}/privkey.pem
- Creates /etc/letsencrypt/live/${DOMAIN}/cert.pem
- Creates /etc/tls/haproxy/${DOMAIN}.pem
- Creates /etc/tls/dhparam.pem

## Usage

```sh
bash letsencrypt.sh example.com example2.com
```