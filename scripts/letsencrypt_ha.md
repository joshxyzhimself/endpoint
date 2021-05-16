
## Notes

- Installs stable HAProxy branch by default
- HAProxy config path: nano /etc/haproxy/haproxy.cfg

## Flow

- Installs certbot (if needed)
- Installs haproxy (if needed)
- Stops haproxy service
- Creates haproxy tls dir
- Creates tls ceritifate files for domains
- Creates tls dhparam file (if needed)
- Starts haproxy service

## Usage

```sh
bash letsencrypt.sh example.com example2.com example3.com
```