
const { EndpointServer, HTTPError, path_from_cwd } = require('../index');

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
        <a href="/login">/login</a>
        <pre>${JSON.stringify(request, null, 2)}</pre>
      </body>
    </html>
  `;
  return response;
});

endpoint.get('/login', (request, response) => {
  if (request.headers.authorization === undefined) {
    response.code = 401;
    response.headers['WWW-Authenticate'] = 'Basic realm="Access to the staging site", charset="UTF-8"';
    return response;
  }
  const authorization = Buffer.from(request.headers.authorization.substring(6), 'base64').toString('utf-8');
  response.html = `
    <!doctype html>
    <html lang="en">
      <head>
        <title>Test</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no" />
      </head>
      <body class="app-body">
        <p>/login</p>
        <a href="/logout">/logout</a>
        <p>${authorization}</p>
        <pre>${JSON.stringify(request, null, 2)}</pre>
      </body>
    </html>
  `;
  return response;
});

endpoint.get('/logout', (request, response) => {
  response.code = 401;
  response.html = `
    <!doctype html>
    <html lang="en">
      <head>
        <title>Test</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no" />
      </head>
      <body class="app-body">
        <p>/logout</p>
        <a href="/login">/login</a>
        <pre>${JSON.stringify(request, null, 2)}</pre>
      </body>
    </html>
  `;
  return response;
});


// listen to port 8080
endpoint.http(8080);