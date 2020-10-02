
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

#### Usage

```js
const { EndpointServer, HTTPError, path_from_cwd } = require('../index');

const endpoint = new EndpointServer({
  use_compression: false,
  use_session_id: false,
  session_max_age: 0,
  use_websocket: false,
  use_stack_trace: true,
  referrer_policy: 'no-referrer', // can be "no-referrer" or "same-origin"
  x_dns_prefetch_control: 'off', // can be "off" on "on"
});


// expose static directories
endpoint.static('/', path_from_cwd('/static'), 'no-cache');
endpoint.static('/images', path_from_cwd('/static/images'), 'private, max-age=3600, s-maxage=3600');

// return HTML, catch-all, as text/html; charset=utf-8
endpoint.get('*', (request, response) => {
  response.headers['Cache-Control'] = 'no-cache';
  response.text = `
    <!doctype html>
    <html lang="en">
      <head>
        <title>Test</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no" />
      </head>
      <body class="app-body">
        <p>Catch-all page</p>
      </body>
    </html>
  `;
  return response;
});

// return HTML, as text/html; charset=utf-8
endpoint.get('/', (request, response) => {
  response.headers['Cache-Control'] = 'no-cache';
  response.text = `
    <!doctype html>
    <html lang="en">
      <head>
        <title>Test</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no" />
      </head>
      <body class="app-body">
        <p>Home page</p>
      </body>
    </html>
  `;
  return response;
});

// return JSON, as application/json; charset=utf-8
endpoint.get('/test-json', (request, response) => {
  response.json = { request };
  return response;
});

// return Buffer, as application/octet-stream
endpoint.get('/test-buffer', (request, response) => {
  response.buffer = Buffer.from('test-buffer');
  response.headers['Content-Disposition'] = `attachment; filename="test-buffer.txt"`;
  return response;
});

// return Redirect, accepts 301/302/307/308
endpoint.get('/test-redirect', (request, response) => {
  response.code = 301;
  response.redirect = '/test';
  return response;
});

// return 405 error
endpoint.get('/test-405', () => {
  throw new HTTPError(405);
});

// return 404 error, with error message
endpoint.get('/test-404', () => {
  throw new HTTPError(404, 'Optional error test message.');
});

// return 400 error, with custom error stack
endpoint.get('/test-400', () => {
  try {
    throw Error('some error');
  } catch (e) {
    throw new HTTPError(400, undefined, e.stack);
  }
});

// return 500 error, with error stack preserved, same as above
endpoint.get('/test-500-1', () => {
  throw Error('some error');
});

// return 500 error, an internal error
endpoint.get('/test-500-2', () => {
  return 123; // unexpected return value
});

// listen to port 8080
endpoint.http(8080);
```

#### License

MIT
