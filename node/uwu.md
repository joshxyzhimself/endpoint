
# uWebSocket Utilities (uwu.js)

## usage

```js
const uwu = require('endpoint/node/uwu');
```

## uwu.serve_handler(handler)

- Notes
  - `handler` function has `response` and `request` parameters
- Parameters
  - `handler` - `Function`, async function for handling request
- `response` properties
  - `response.status` - Number, for HTTP status
  - `response.headers` - Object, for HTTP headers
  - `response.text` - String, override if sending `text/plain`
  - `response.html` - String, override if sending `text/html`
  - `response.json` - Object, override if sending `application/json`
  - `response.buffer` - Buffer, override if sending `application/octet-stream`
  - `response.file_name` - String, file name for `content-disposition`
  - `response.file_dispose` - Boolean, uses `content-disposition`
  - `response.file_cache` - Boolean, cache static files in memory, defaults to `false`
  - `response.file_cache_max_age_ms` - Number, cached static files max age in ms, defaults to `Infinity`
  - `response.compress` - Boolean, compresses response, defaults to `false`
- `request` properties
  - `request.url` - String
  - `request.query` - String
  - `request.method` - String
  - `request.headers` - Object, HTTP headers
  - `request.headers.host` - String
  - `request.headers.accept` - String
  - `request.headers.accept_encoding` - String
  - `request.headers.content_type` - String
  - `request.headers.if_none_match` - String
  - `request.headers.user_agent` - String
  - `request.json` - Object, received `application/json`

```js
// Logging request; serving HTML
app.get('/*', uwu.serve_handler(async (response, request) => {
  console.log({ request });
  response.html = `
    <html>
      <body>
        <h4>Hello world!</h4>
      </body>
    </html>
  `;
}));

// Setting headers; serving JSON
app.get('/test-json', uwu.serve_handler(async (response, request) => {
  response.headers['Cache-Control'] = uwu.cache_control_types.no_store;
  response.json = { foo: 'bar', random: Math.random() };
}));

// Serving file
app.get('/test3', uwu.serve_handler(async (response, request) => {
  console.log({ request });
  response.headers['Cache-Control'] = uwu.cache_control_types.no_cache;
  response.file_path = __filename;
  response.file_cache = true;
  response.compress = true;
  response.file_dispose = false;
}));
```

## uwu.serve_static(app, route_path, local_path, response_override?)

- Notes
  - For serving static files
  - Used before using `uwu.serve_handler`.
- Parameters
  - `app` - `Object`, uWebSockets app instance
  - `route_path` - `String`, web route path
  - `local_path` - `String`, local file folder path
  - `response_override?` - `Object`, overrides the response object

```js
uwu.serve_static(app, '/scripts/', '/whatever/dir/scripts/');
```

## uwu.cache_control_types

- Notes
  - Exposed built-in values for `cache-control` header

```js
const cache_control_types = {
  // For sensitive data
  no_store: 'no-store, max-age=0',

  // For dynamic data
  no_cache: 'no-cache',

  // For private static data
  private_cached: 'private, max-age=3600, s-maxage=3600',

  // For public static data
  public_cached: 'public, max-age=86400, s-maxage=86400',
};
```
