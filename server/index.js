
const fs = require('fs');
const url = require('url');
const zlib = require('zlib');
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const { extname, dirname, basename, join } = require('path');

const mime = require('mime-types');
const cookie = require('cookie');
const Busboy = require('busboy');
const statuses = require('statuses');
const is_ip = require('is-ip');
const WebSocket = require('ws');

const methods = ['HEAD', 'GET', 'POST', 'PUT', 'DELETE'];

class HTTPError extends Error {
  constructor (code, ...params) {
    super(params);

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, HTTPError);
    }

    this.code = code;
    this.status = statuses.message[code] || 'Unknown';
  }
  headers () {
    return { 'Content-Type': 'application/json' };
  }
  body () {
    return {
      error: {
        code: this.code,
        status: this.status,
        message: this.message,
        timestamp: new Date().toISOString(),
      }
    };
  }
}

const complete = (request2, response, response2) => {
  response2.headers['Content-Length'] = response2.body.byteLength;
  if (request2.method === 'HEAD') {
    delete response2.body;
  }

  if (response2.headers['Cache-Control'] === undefined) {
    response2.headers['Cache-Control'] = 'no-store';
  } else if (response2.headers['Cache-Control'] !== 'no-store') {
    response2.headers['ETag'] = crypto.createHash('sha256').update(response2.body).digest('hex');
    if (request2.headers['if-none-match'] !== undefined) {
      if (request2.headers['if-none-match'] === response2.headers['ETag']) {
        response2.code = 304;
        delete response2.body;
      }
    }
  }

  response.writeHead(response2.code, response2.headers).end(response2.body);
};

const prepare = (request2, response, response2, options, error) => {

  if (error instanceof HTTPError) {
    response2.code = error.code;
    response2.headers = error.headers();
    response2.body = error.body();
  }

  if (Buffer.isBuffer(response2.body) === false) {
    if (typeof response2.body === 'object') { // application/json; charset=utf-8
      response2.body = JSON.stringify(response2.body);
    }
    if (typeof response2.body === 'string') { // 'text/html; charset=utf-8'
      response2.body = Buffer.from(response2.body);
    }
  }

  if (options.use_compression === true) {
    if (request2.headers['accept-encoding'] !== undefined) {
      if (request2.headers['accept-encoding'].includes('br') === true) {
        response2.headers['Content-Encoding'] = 'br';
        zlib.brotliCompress(response2.body, (err, compressedBody) => {
          response2.body = compressedBody;
          complete(request2, response, response2);
        });
        return;
      }
      if (request2.headers['accept-encoding'].includes('gzip') === true) {
        response2.headers['Content-Encoding'] = 'gzip';
        zlib.gzip(response2.body, (err, compressedBody) => {
          response2.body = compressedBody;
          complete(request2, response, response2);
        });
        return;
      }
    }
  }

  complete(request2, response, response2);
};

const handle = async (request2, response, response2, handlers, options) => {
  try {
    let response3;
    for (let i = 0, l = handlers.length; i < l; i += 1) {
      const handler = handlers[i];
      response3 = await handler(request2, response2);
      if (response3 === response2) {
        break;
      }
      if (response3 !== undefined) {
        throw new Error('Invalid handler return type, expecting "response" object or "undefined", or a thrown "HTTPError" error.');
      }
    }
    if (response3 === undefined) {
      throw new Error('Invalid handler return type, at least one handler must return the "response" object or throw an "HTTPError" error.');
    }
    return prepare(request2, response, response2, options);
  } catch (e) {
    if (e instanceof HTTPError) {
      return prepare(request2, response, response2, options, e);
    }
    return prepare(request2, response, response2, options, new HTTPError(500, e.message));
  }
};

const get_request_ip_address = (request) => {
  let ip = '';

  if (typeof request.socket === 'object' && typeof request.socket.remoteAddress === 'string') {
    const temp_ip = request.socket.remoteAddress;
    if (is_ip(temp_ip) === true) {
      ip = temp_ip;
    }
  }

  if (typeof request.headers['x-forwarded-for'] === 'string') {
    const temp_ip = request.headers['x-forwarded-for'].split(/\s*,\s*/)[0];
    if (is_ip(temp_ip) === true) {
      ip = temp_ip;
    }
  }

  if (ip.substring(0, 7) === '::ffff:' && is_ip.v4(ip.substring(8)) === true) {
    ip = ip.substring(7);
  }

  return ip;
};

const get_request_user_agent = (request) => {
  let ua = '';
  if (typeof request.headers['user-agent'] === 'string') {
    ua = request.headers['user-agent'];
  }
  return ua;
};

function EndpointServer(options) {

  const endpoint = this;

  const static_map = new Map();
  const cache_control_map = new Map();

  endpoint.static = (dir, dir2, cacheControl) => {
    if (typeof dir !== 'string') {
      throw new Error('EndpointServer.static(dir, dir2, cacheControl), "dir" must be a string.');
    }
    if (dir.substring(0, 1) !== '/') {
      throw new Error('EndpointServer.static(dir, dir2, cacheControl), "dir" must have leading slash.');
    }
    if (dir.length > 1 && dir.substring(dir.length - 1, dir.length) === '/') {
      throw new Error('EndpointServer.static(dir, dir2, cacheControl), "dir" must not have trailing slash.');
    }
    if (typeof dir2 !== 'string') {
      throw new Error('EndpointServer.static(dir, dir2, cacheControl), "dir2" must be a string.');
    }
    if (dir2.substring(0, 1) !== '/') {
      throw new Error('EndpointServer.static(dir, dir2, cacheControl), "dir2" must have leading slash.');
    }
    if (dir2.length > 1 && dir2.substring(dir2.length - 1, dir2.length) === '/') {
      throw new Error('EndpointServer.static(dir, dir2, cacheControl), "dir2" must not have trailing slash.');
    }
    if (cacheControl !== undefined && typeof cacheControl !== 'string') {
      throw new Error('EndpointServer.static(dir, dir2, cacheControl), "cacheControl" must be a string.');
    }
    static_map.set(dir, dir2);
    if (cacheControl !== undefined) {
      cache_control_map.set(dir, cacheControl);
    }
  };

  const routes_map = new Map();

  methods.forEach((method) => {
    const route_map = new Map();
    endpoint[method.toLowerCase()] = (path, handler) => {
      if (typeof path !== 'string') {
        throw new Error('EndpointServer.method(path, handler), "path" must be a string.');
      }
      if (typeof handler !== 'function') {
        throw new Error('EndpointServer.method(path, handler), "handler" must be a function.');
      }
      if (path !== '*' && path.substring(0, 1) !== '/') {
        throw new Error('EndpointServer.method(path, handler), "path" must have leading slash.');
      }
      if (path.length > 1 && path.substring(path.length - 1, path.length) === '/') {
        throw new Error('EndpointServer.method(path, handler), "path" must not have trailing slash.');
      }
      if (route_map.has(path) === false) {
        route_map.set(path, [handler]);
      } else {
        route_map.get(path).push(handler);
      }
    };
    routes_map.set(method, route_map);
  });

  if (typeof options !== 'object' || options === null) {
    throw new Error('new EndpointServer(options), "options" must be a plain object.');
  }
  if (typeof options.use_compression !== 'boolean') {
    throw new Error('new EndpointServer(options), "options.use_compression" must be a boolean.');
  }
  if (Number.isInteger(options.session_max_age) === false || options.session_max_age < 0) {
    throw new Error('new EndpointServer(options), "options.session_max_age" must be an integer >= 0.');
  }
  if (typeof options.use_websocket !== 'boolean') {
    throw new Error('new EndpointServer(options), "options.use_websocket" must be a boolean.');
  }

  const requestListener = async (request, response) => {

    const ip = get_request_ip_address(request);
    const ua = get_request_user_agent(request);

    const request2 = {
      ip,
      ua,
      encrypted: request.socket.encrypted === true,
      method: request.method,
      headers: request.headers,
      url: url.parse(request.url, true)
    };

    const response2 = {
      code: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {}
    };

    if (methods.includes(request2.method) === false) {
      return prepare(request2, response, response2, options, new HTTPError(405));
    }


    if (request2.headers.cookie === undefined) {
      request2.sid = crypto.randomBytes(32).toString('hex');
      if (options.session_max_age > 0) {
        response2.headers['Set-Cookie'] = `sid=${request2.sid}; Path=/; Max-Age=${options.session_max_age}; SameSite=Strict;`;
      } else {
        response2.headers['Set-Cookie'] = `sid=${request2.sid}; Path=/; SameSite=Strict;`;
      }
    } else {
      const cookies = cookie.parse(request2.headers.cookie);
      if (cookies.sid === undefined) {
        request2.sid = crypto.randomBytes(32).toString('hex');
        if (options.session_max_age > 0) {
          response2.headers['Set-Cookie'] = `sid=${request2.sid}; Path=/; Max-Age=${options.session_max_age}; SameSite=Strict;`;
        } else {
          response2.headers['Set-Cookie'] = `sid=${request2.sid}; Path=/; SameSite=Strict;`;
        }
      } else {
        request2.sid = cookies.sid;
      }
    }

    if (request2.method === 'HEAD' || request2.method === 'GET') {
      const ext = extname(request2.url.pathname);
      if (ext !== '') {
        const dir = dirname(request2.url.pathname);
        if (static_map.has(dir) === false) {
          return prepare(request2, response, response2, options, new HTTPError(404));
        }
        const dir2 = static_map.get(dir);

        const file_basename = basename(request2.url.pathname);
        const file_path = join(dir2, file_basename);

        try {
          await fs.promises.access(file_path);
        } catch (e) {
          return prepare(request2, response, response2, options, new HTTPError(404));
        }

        const file_content_type = mime.contentType(file_basename);
        if (file_content_type === false) {
          return prepare(request2, response, response2, options, new HTTPError(400));
        }

        const file_content_buffer = await fs.promises.readFile(file_path);
        if (cache_control_map.has(dir) === true) {
          response2.headers['Cache-Control'] = cache_control_map.get(dir);
        }
        response2.headers['Content-Type'] = file_content_type;
        response2.body = file_content_buffer;
        return prepare(request2, response, response2, options);
      }
    }

    const route_map = routes_map.get(request2.method);

    let handlers = route_map.get(request2.url.pathname);

    if (request2.method === 'HEAD' || request2.method === 'GET') {
      if (handlers === undefined) {
        handlers = route_map.get('*');
      }
    }

    if (handlers !== undefined) {

      if (request2.headers['content-type'] !== undefined) {

        if (request2.headers['content-type'].includes('application/json') === true) {
          let buffer = Buffer.alloc(0);
          request.on('data', (chunk) => {
            buffer = Buffer.concat([buffer, chunk]);
          });
          request.on('end', () => {
            try {
              request2.body = JSON.parse(buffer.toString());
              request2.body_buffer = buffer;
            } catch (e) {
              return prepare(request2, response, response2, options, new HTTPError(400));
            }
            return handle(request2, response, response2, handlers, options);
          });
          return;
        } else {
          if (request2.headers['content-type'].includes('multipart/form-data') === true || request2.headers['content-type'].includes('application/x-www-form-urlencoded') === true) {
            const busboy = new Busboy({ headers: request2.headers, limits: { fieldSize: Infinity } });
            request2.body = {};
            request2.files = [];
            busboy.on('file', (fieldname, file, fileName, encoding, mimeType) => {
              let buffer = Buffer.alloc(0);
              file.on('data', (data) => {
                buffer = Buffer.concat([buffer, data]);
              });
              file.on('end', () => {
                switch (fieldname) {
                  case 'body': {
                    if (mimeType === 'application/json') {
                      request2.body = JSON.parse(buffer.toString());
                    }
                    break;
                  }
                  case 'files': {
                    request2.files.push({ file: buffer, fieldname, fileName, encoding, mimeType, });
                    break;
                  }
                  default: {
                    break;
                  }
                }
              });
            });
            busboy.on('field', (fieldname, val) => {
              request2.body[fieldname] = val;
            });
            busboy.on('finish', async () => {
              return handle(request2, response, response2, handlers, options);
            });
            return request.pipe(busboy);
          }
        }
      }

      return handle(request2, response, response2, handlers, options);
    }

    return prepare(request2, response, response2, options, new HTTPError(404));
  };

  this.http_server = null;
  this.http = (port, callback) => {
    const http_server = http.createServer(requestListener);
    http_server.on('close', () => console.error('Server closed'));
    http_server.on('error', (e) => console.error('Server error', e.message));
    http_server.listen(port, callback);
    this.http_server = http_server;
  };

  this.https_server = null;
  this.websocket_server = null;
  this.https = (port, key, cert, ca, callback) => {
    const https_server = https.createServer({ key, cert, ca }, requestListener);
    https_server.on('close', () => console.error('Server closed'));
    https_server.on('error', (e) => console.error('Server error', e.message));
    if (options.use_websocket === true && typeof options.on_websocket_connection === 'function') {
      const websocket_server = new WebSocket.Server({ server: https_server });
      const websocket_client_is_alive = new WeakMap();
      websocket_server.on('connection', async (websocket_client, request) => {
        websocket_client.ip = get_request_ip_address(request);
        websocket_client.ua = get_request_user_agent(request);
        websocket_client_is_alive.set(websocket_client, true);
        websocket_client.on('pong', () => websocket_client_is_alive.set(websocket_client, true));
        options.on_websocket_connection(websocket_client);
      });
      setInterval(() => websocket_server.clients.forEach((websocket_client) => {
        if (websocket_client_is_alive.get(websocket_client) === false) {
          websocket_client.terminate();
          return;
        }
        websocket_client_is_alive.set(websocket_client, false);
        try {
          websocket_client.ping(() => {});
        } catch (e) {
          console.error(e);
        }
      }), 30000);
      this.websocket_server = websocket_server;
    }
    https_server.listen(port, callback);
    this.https_server = https_server;
  };
}

module.exports = { EndpointServer, HTTPError };
