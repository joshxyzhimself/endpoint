
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

- insecure GET and HEAD requests are upgraded
- insecure POST request return 405
- support return of buffer
- setting response.json sets "application/json; charset=utf-8" content-type
- setting response.text sets "text/html; charset=utf-8" content-type
- setting response.text sets "application/octet-stream" content-type
- streaming raw file reads
- streaming raw file compression
- raw file hash caching
- compressed file length caching
- compressed file hash caching
- compressed file data caching
- raw file 304 if request.headers.if-none-match matches etag
- compressed file 304 if request.headers.if-none-match matches etag

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
```

#### License

MIT
