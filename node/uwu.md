
# uWebSocket Utilities (uwu.js)

## usage

```js
/**
 * @type {import('endpoint/node/uwu').uwu}
 */
const uwu = require('endpoint/node/uwu');
```

## uwu.serve_handler(handler)

- Notes
  - Compatible with `uws.get`, `uws.post`
  - `handler` function has `response` and `request` parameters
  - `response.compress` is currently broken
- Parameters
  - `handler` - `Function`, async function for handling request
- `response` properties
  - `response.status` - Number, for HTTP status
  - `response.headers` - Object, for HTTP headers
  - `response.text` - String, override if sending `text/plain`
  - `response.html` - String, override if sending `text/html`
  - `response.json` - Object, override if sending `application/json`
  - `response.buffer` - Buffer, override if sending `application/octet-stream`
  - `response.compress` - Boolean, compresses response, defaults to `false`
  - `response.dispose` - Boolean, uses `content-disposition`
  - `response.file_name` - String, file name for `content-disposition`
- `request` properties
  - `response.url` - String
  - `response.query` - String
  - `response.headers` - Object, HTTP headers
  - `response.headers.accept` - String
  - `response.headers.accept_encoding` - String
  - `response.headers.content_type` - String
  - `response.headers.if_none_match` - String
  - `response.headers.user_agent` - String
  - `response.json` - Object, received `application/json`

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
  response.cache_files = true;
  response.compress = true;
  response.dispose = false;
}));
```

## uwu.serve_static(app, route_path, local_path, response_override?)

- Notes
  - Intended for serving static files
  - Should be used before using `uwu.serve_handler`.
- Parameters
  - `app` - `Object`, uWebSockets app instance
  - `route_path` - `String`, web route path
  - `local_path` - `String`, local file folder path
  - `response_override?` - `Object`, overrides the response object

```js
uwu.serve_static(app, '/scripts/', '/scripts/');
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
