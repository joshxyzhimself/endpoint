
const assert = require('assert');
const { EndpointServer, HTTPError, path_from_cwd } = require('../index');
const middlewares = require('./middlewares');

const endpoint = new EndpointServer({
  use_compression: false,
  use_session_id: true,
  session_max_age: 0,
  use_websocket: false,
  use_stack_trace: true,
  referrer_policy: 'no-referrer', // can be "no-referrer" or "same-origin"
  x_dns_prefetch_control: 'off', // can be "off" on "on"
});

// expose static directories
endpoint.static('/', path_from_cwd('/server/demo/static'), 'no-cache');
endpoint.static('/images', path_from_cwd('/server/demo/static/images'), 'private, max-age=3600, s-maxage=3600');

// return HTML, catch-all, as text/html; charset=utf-8
endpoint.get('*', (request, response) => {
  response.headers['Cache-Control'] = 'no-cache';
  response.html = `
    <!doctype html>
    <html lang="en">
      <head>
        <title>Test</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no" />
      </head>
      <body class="app-body">
        <p>Catch-all page</p>
        <a href="/test-page-1">/test-page-1</a>
        <br />
        <a href="/images/capoo.jpeg">/images/capoo.jpeg</a>
        <br />
        <a href="/test-text">/test-text</a>
        <br />
        <a href="/test-json">/test-json</a>
        <br />
        <a href="/test-buffer">/test-buffer</a>
        <br />
        <a href="/test-redirect">/test-redirect</a>
        <br />
        <a href="/test-405">/test-405</a>
        <br />
        <a href="/test-404">/test-404</a>
        <br />
        <a href="/test-400">/test-400</a>
        <br />
        <a href="/test-500">/test-500</a>
        <br />
        <a href="/test-500-1">/test-500-1</a>
        <br />
        <a href="/test-500-2">/test-500-2</a>
        <br />
        <hr />
        <p>pages</p>
        <a href="/login">/login</a>
        <br />
        <a href="/account">/account</a>
        <br />
        <p>actions</p>
        <a href="/login-user">/login-user</a>
        <br />
        <a href="/logout-user">/logout-user</a>
        <br />
        <hr />
      </body>
    </html>
  `;
  return response;
});

// return HTML, as text/html; charset=utf-8
endpoint.get('/test-page-1', (request, response) => {
  response.headers['Cache-Control'] = 'no-cache';
  response.html = `
    <!doctype html>
    <html lang="en">
      <head>
        <title>Test</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no" />
      </head>
      <body class="app-body">
        <p>You're now at /test-page-1</p>
      </body>
    </html>
  `;
  return response;
});

// return string, as text/plain; charset=utf-8
endpoint.get('/test-text', (request, response) => {
  response.text = 'test';
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
  response.filename = 'test-buffer-xyz.txt';
  return response;
});

// return Redirect, accepts 301/302/307/308
endpoint.get('/test-redirect', (request, response) => {
  response.code = 301;
  response.headers.Location = '/test-page-1';
  return response;
});

/**
 * NOTE THAT YOU CAN SPECIFY code, message, AND internal_error
 * - code & message is returned to client
 * - internal error is NOT returned to client
 */

// return 405 error
endpoint.get('/test-405', () => {
  throw new HTTPError(405, null, null); // this is how it works internally
});

// return 404 error
endpoint.get('/test-404', () => {
  throw new HTTPError(404, null, null); // this is how it works internally
});

// return 400 error, CLIENT-SIDE ERROR
endpoint.get('/test-400', () => {
  HTTPError.assert(Math.random() < 0, 400, 'this error message is exposed to client.');
});

// return 500 error, SERVER-SIDE ERROR
endpoint.get('/test-500', () => {
  assert(Math.random() < 0, 'this error message is NOT exposed to client.');
});

// return 500 error, SERVER-SIDE ERROR
endpoint.get('/test-500-1', () => {
  throw new Error('this error message is NOT exposed to client.');
});

// return 500 error, SERVER-SIDE ERROR
endpoint.get('/test-500-2', () => {
  return 123; // unexpected return value
});


endpoint.get('/login', middlewares.cookie_sessions);
endpoint.get('/login', middlewares.guests_only);
endpoint.get('/login', (request, response) => {
  response.html = `
    <!doctype html>
    <html lang="en">
      <head>
        <title>Test</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no" />
      </head>
      <body class="app-body">
        <p>You're now at /login, this page is for guests!</p>
      </body>
    </html>
  `;
  return response;
});

endpoint.get('/account', middlewares.cookie_sessions);
endpoint.get('/account', middlewares.users_only);
endpoint.get('/account', (request, response) => {
  response.html = `
    <!doctype html>
    <html lang="en">
      <head>
        <title>Test</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no" />
      </head>
      <body class="app-body">
        <p>You're now at /account page, this page is for users!</p>
      </body>
    </html>
  `;
  return response;
});

endpoint.get('/login-user', middlewares.cookie_sessions);
endpoint.get('/login-user', middlewares.guests_only);
endpoint.get('/login-user', (request, response) => {
  request.session.user = { id: 'alice-id' };
  response.html = `
    <!doctype html>
    <html lang="en">
      <head>
        <title>Test</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no" />
      </head>
      <body class="app-body">
        <p>You're now logged-in!</p>
      </body>
    </html>
  `;
  return response;
});

endpoint.get('/logout-user', middlewares.cookie_sessions);
endpoint.get('/logout-user', middlewares.users_only);
endpoint.get('/logout-user', (request, response) => {
  request.session.user = null;
  response.html = `
    <!doctype html>
    <html lang="en">
      <head>
        <title>Test</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no" />
      </head>
      <body class="app-body">
        <p>You're now logged-out!</p>
      </body>
    </html>
  `;
  return response;
});


// listen to port 8080
endpoint.http(8080);