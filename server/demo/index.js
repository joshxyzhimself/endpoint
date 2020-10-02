
const fs = require('fs');
const crypto = require('crypto');
const { EndpointServer, HTTPError, path_from_cwd } = require('../index');

const client_script = fs.readFileSync(path_from_cwd('/client/index.iife.js'));

const endpoint = new EndpointServer({
  use_compression: false,
  use_session_id: false,
  session_max_age: 0,
  use_websocket: false,
  use_stack_trace: true,
  referrer_policy: 'no-referrer', // can be "no-referrer" or "same-origin"
  x_dns_prefetch_control: 'off', // can be "off" on "on"
  tls_min_version: 'TLSv1.3', // can be "TLSv1.3" or "TLSv1.2"
});

// Cache-Control: no-store
// default, for sensitive data

// Cache-Control: no-cache
// ideal for html

// Cache-Control: private, max-age=3600, s-maxage=3600
// ideal for static files

// http://localhost:8080/favicon.ico
// http://localhost:8080/images/capoo.jpeg
endpoint.static('/', path_from_cwd('/static'), 'no-cache');
endpoint.static('/images', path_from_cwd('/static/images'), 'private, max-age=3600, s-maxage=3600');

// http://localhost:8080/
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

endpoint.get('/test', (request, response) => {
  response.json = { request };
  return response;
});
endpoint.get('/test-buffer', (request, response) => {
  response.buffer = Buffer.from('test-buffer');
  response.headers['Content-Disposition'] = 'attachment; filename="test-buffer.txt"';
  return response;
});
endpoint.get('/test-redirect', (request, response) => {
  response.code = 301;
  response.redirect = '/test';
  return response;
});

endpoint.get('/client-test', (request, response) => {
  response.headers['Content-Type'] = 'text/html; charset=utf-8';
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
        <p>Client Test</p>
        <hr />
        <button onclick="window.test404()">Test 404</button>
        <hr />
        <button onclick="window.test405()">Test 405</button>
        <hr />
        <button onclick="window.test500()">Test 500</button>
        <hr />
        <script>
          window.test404 = () => {
            EndpointClient.request({ url: '/error-test-404', method: 'GET' })
              .then((response) => {
                console.log('THEN', response);
              })
              .catch((response) => {
                console.error('CATCH', response);
              });
          };
          window.test405 = () => {
            EndpointClient.request({ url: '/error-test-405', method: 'GET' })
              .then((response) => {
                console.log('THEN', response);
              })
              .catch((response) => {
                console.error('CATCH', response);
              });
          };
          window.test500 = () => {
            EndpointClient.request({ url: '/error-test-500', method: 'GET' })
              .then((response) => {
                console.log('THEN', response);
              })
              .catch((response) => {
                console.error('CATCH', response);
              });
          };
          ${client_script}
        </script>
      </body>
    </html>
  `;
  return response;
});

endpoint.get('/auth-test', (request, response) => {
  response.headers['Content-Type'] = 'text/html; charset=utf-8';
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
        <p>Auth Test page</p>
        <hr />
        <button onclick="window.auth()">Auth</button>
        <hr />
        <button onclick="window.test1()">Auth Get</button>
        <hr />
        <button onclick="window.test2()">Auth Post</button>
        <hr />
        <button onclick="window.deauth()">De-auth</button>
        <script>
          window.auth = () => {
            EndpointClient.auth('test', '1234');
          };
          window.deauth = () => {
            EndpointClient.deauth();
          };
          window.test1 = () => {
            EndpointClient.request({ url: 'http://localhost:8080/auth-get?foo=bar', method: 'GET' })
              .then(console.log)
              .catch(console.error);
          };
          window.test2 = () => {
            EndpointClient.request({ url: 'http://localhost:8080/auth-post?foo=bar', method: 'POST', body: { foo: 'bar' } })
              .then(console.log)
              .catch(console.error);
          };
          ${client_script}
        </script>
      </body>
    </html>
  `;
  return response;
});

endpoint.get('/error-test-404', () => {
  throw new HTTPError(404, 'Error test message.');
});

endpoint.get('/error-test-405', () => {
  throw new HTTPError(405, 'Error test message.');
});

endpoint.get('/error-test-500', () => {
  return 123; // invalid return value
});

const ResponseError = (response, code, message) => {
  response.json = { error: { code, message } };
  return response;
};

const key2_secret2_map = new Map();

key2_secret2_map.set(
  crypto.createHash('sha256').update('test').digest('hex'),
  crypto.scryptSync('1234', crypto.createHash('sha256').update('test1234').digest(), 32, { N: 2 ** 15, r: 8, p: 1, maxmem: 128 * (2 ** 16) * 8 * 1}),
);

const auth_middleware = async (request, response) => {
  if (request.headers['x-key'] === undefined) {
    return ResponseError(response, 401, 'NOT AUTHORIZED. MISSING X-KEY.');
  }
  if (request.headers['x-timestamp'] === undefined) {
    return ResponseError(response, 401, 'NOT AUTHORIZED. MISSING X-TIMESTAMP');
  }
  if (request.headers['x-signature'] === undefined) {
    return ResponseError(response, 401, 'NOT AUTHORIZED. MISSING X-SIGNATURE');
  }
  const key = request.headers['x-key'];
  if (key2_secret2_map.has(key) === false) {
    return ResponseError(response, 401, 'NOT AUTHORIZED. INVALID X-KEY');
  }
  const secret = key2_secret2_map.get(key);
  const timestamp = request.headers['x-timestamp'];
  const timestamp2 = Number(timestamp);
  if (Number.isInteger(timestamp2) === false || Date.now() - timestamp2 >= 1000) {
    return ResponseError(response, 401, 'NOT AUTHORIZED. INVALID X-TIMESTAMP');
  }
  const signature = Buffer.from(request.headers['x-signature'], 'hex');
  const signature_recalc = crypto.createHmac('sha256', secret)
    .update(timestamp)
    .update(request.method)
    .update(request.url.pathname)
    .update(request.url.search || '')
    .update(request.body_buffer || '')
    .digest();

  if (crypto.timingSafeEqual(signature, signature_recalc) === false) {
    return ResponseError(response, 401, 'NOT AUTHORIZED. INVALID X-SIGNATURE');
  }
  return undefined;
};

endpoint.post('/auth-get', auth_middleware);
endpoint.post('/auth-post', auth_middleware);

endpoint.get('/auth-get', (request, response) => {
  response.json = { foo: 'bar' };
  return response;
});

endpoint.post('/auth-post', (request, response) => {
  response.json = { foo: 'bar' };
  return response;
});

endpoint.http(8080);