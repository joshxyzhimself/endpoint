
#### Initial Notes

- Supports `head`, `get`, `post`, `put`, `delete` methods
- Accepts `content-type` of `application/json`
- Accepts `content-type` of `multipart/form-data`
  - Accepts JSON `body` along with `files`
- Accepts `content-type` of `application/x-www-form-urlencoded`
- Returns `content-type` of `application/json`
- Accepts `accept-encoding` for `brotli`, `gzip` compression
- Returns `content-encoding` for `brotli`, `gzip` compression
- Returns `content-length`

#### Recent Updates

- if https available, insecure GET and HEAD requests are upgraded
- if https available, insecure non-GET and non-HEAD requests return 405
- response.json for "application/json; charset=utf-8" content-type
- response.text for "text/plain; charset=utf-8" content-type
- response.html for "text/html; charset=utf-8" content-type
- response.filename for content-disposition
- response.buffer for "application/octet-stream" content-type
- response.stream for "application/octet-stream" content-type
- response buffer compression
- response stream compression
- static raw file: hash caching
- static raw file: if request.headers.if-none-match matches etag, returns 304
- static raw file: compression
- static compressed file: streaming
- static compressed file: length caching
- static compressed file: hash caching
- static compressed file: if request.headers.if-none-match matches etag, returns 304
- https: tls_min_version
- https: dhparam
- https: cipher server preference, prioritize chacha, honor cipher order
- https: no ticket, no sslv2, no sslv3, no tlsv1, no tlsv1.1
- https: no tlsv1.2 if tls_min_version is tlsv1.3
- utils: endpoint/server/scrypt helper
- csp: upgrade-insecure-requests; if https available
- csp: default-src ${protocol}://${host}; if html
- csp: default-src 'none'; if json, text, buffer, stream

#### Cache

```
Cache-Control: no-store
- default, for sensitive data

Cache-Control: no-cache
- ideal for html pages

Cache-Control: private, max-age=3600, s-maxage=3600
- ideal for static files
```

#### Demo

```sh
node ./server/demo/latest.js
node ./server/demo/basic_auth.js
```

#### License

MIT
