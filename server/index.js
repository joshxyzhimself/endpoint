
const fs = require('fs');
const url = require('url');
const zlib = require('zlib');
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const { extname, dirname, basename, join, isAbsolute } = require('path');

const mime = require('mime-types');
const cookie = require('cookie');
const Busboy = require('busboy');
const statuses = require('statuses');
const is_ip = require('is-ip');
const WebSocket = require('ws');

const http_methods = new Set(['HEAD', 'GET', 'POST', 'PUT', 'DELETE']);

class HTTPError extends Error {
  constructor (code, message) {
    super(message);

    if (Number.isInteger(code) === false) {
      throw new Error('new HTTPError(code, message), "code" must be an integer.');
    }
    if (message !== undefined && typeof message !== 'string') {
      throw new Error('new HTTPError(code, message), "message" must be a string.');
    }

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, HTTPError);
    }

    this.code = code;
    this.status = statuses.message[code] || 'Unknown';
  }

  response_headers (config) {
    return {
      'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload;',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': config.referrer_policy, // can be "no-referrer" or "same-origin"
      'X-DNS-Prefetch-Control': config.x_dns_prefetch_control, // can be "off" on "on"
      'Content-Security-Policy': 'default-src https:; upgrade-insecure-requests; connect-src https: \'self\'; img-src https: \'self\'; script-src https: \'unsafe-inline\'; style-src https: \'unsafe-inline\';', // can be edited
      'Content-Type': 'application/json',
    };
  }

  response_body (config) {
    return {
      error: {
        code: this.code,
        status: this.status,
        message: this.message,
        stack: config.use_stack_trace === true ? this.stack : null,
        timestamp: new Date().toISOString(),
      }
    };
  }

  static assert(value, code, message) {
    if (typeof value !== 'boolean') {
      throw new Error('HTTPError.assert(value, code, message), "value" must be a boolean.');
    }
    if (Number.isInteger(code) === false) {
      throw new Error('HTTPError.assert(value, code, message), "code" must be an integer.');
    }
    if (typeof message !== 'string') {
      throw new Error('HTTPError.assert(value, code, message), "message" must be a boolean.');
    }
    if (value === false) {
      throw new HTTPError(code, message);
    }
  }
}

const send_response = (endpoint_request, raw_response, endpoint_response) => {
  endpoint_response.headers['Content-Length'] = endpoint_response.body.byteLength;
  if (endpoint_request.method === 'HEAD') {
    delete endpoint_response.body;
  }

  if (endpoint_request.method === 'HEAD' || endpoint_request.method === 'GET') {
    if (endpoint_response.headers['Cache-Control'] === undefined) {
      endpoint_response.headers['Cache-Control'] = 'no-store';
    } else if (endpoint_response.headers['Cache-Control'] !== 'no-store') {
      endpoint_response.headers['ETag'] = crypto.createHash('sha256').update(endpoint_response.body).digest('hex');
      if (endpoint_request.headers['if-none-match'] !== undefined) {
        if (endpoint_request.headers['if-none-match'] === endpoint_response.headers['ETag']) {
          endpoint_response.code = 304;
          delete endpoint_response.body;
        }
      }
    }
  }

  raw_response.writeHead(endpoint_response.code, endpoint_response.headers).end(endpoint_response.body);
};

const prepare_response = (endpoint_request, raw_response, endpoint_response, config, error) => {

  if (error instanceof HTTPError) {
    endpoint_response.code = error.code;
    endpoint_response.headers = error.response_headers(config);
    endpoint_response.body = error.response_body(config);
  }

  if (Buffer.isBuffer(endpoint_response.body) === false) {
    if (typeof endpoint_response.body === 'object') { // application/json; charset=utf-8
      endpoint_response.body = JSON.stringify(endpoint_response.body);
    }
    if (typeof endpoint_response.body === 'string') { // 'text/html; charset=utf-8'
      endpoint_response.body = Buffer.from(endpoint_response.body);
    }
  }

  if (config.use_compression === true) {
    if (endpoint_request.headers['accept-encoding'] !== undefined) {
      if (endpoint_request.headers['accept-encoding'].includes('br') === true) {
        endpoint_response.headers['Content-Encoding'] = 'br';
        zlib.brotliCompress(endpoint_response.body, (err, compressed_output) => {
          endpoint_response.body = compressed_output;
          send_response(endpoint_request, raw_response, endpoint_response);
        });
        return;
      }
      if (endpoint_request.headers['accept-encoding'].includes('gzip') === true) {
        endpoint_response.headers['Content-Encoding'] = 'gzip';
        zlib.gzip(endpoint_response.body, (err, compressed_output) => {
          endpoint_response.body = compressed_output;
          send_response(endpoint_request, raw_response, endpoint_response);
        });
        return;
      }
    }
  }

  send_response(endpoint_request, raw_response, endpoint_response);
};

const handle_request = async (endpoint_request, raw_response, endpoint_response, handlers, config) => {
  try {
    let returned_endpoint_response;
    for (let i = 0, l = handlers.length; i < l; i += 1) {
      const handler = handlers[i];
      returned_endpoint_response = await handler(endpoint_request, endpoint_response);
      if (returned_endpoint_response === endpoint_response) {
        break;
      }
      if (returned_endpoint_response !== undefined) {
        throw new Error('Invalid handler return type, expecting "endpoint_response" object or "undefined", or a thrown "HTTPError" error.');
      }
    }
    if (returned_endpoint_response === undefined) {
      throw new Error('Invalid handler return type, at least one handler must return the "endpoint_response" object or throw an "HTTPError" error.');
    }
    return prepare_response(endpoint_request, raw_response, endpoint_response, config);
  } catch (e) {
    if (e instanceof HTTPError) {
      return prepare_response(endpoint_request, raw_response, endpoint_response, config, e);
    }
    return prepare_response(endpoint_request, raw_response, endpoint_response, config, new HTTPError(500, e.message));
  }
};

const get_request_ip_address = (raw_request) => {
  let ip = '';

  if (typeof raw_request.socket === 'object' && typeof raw_request.socket.remoteAddress === 'string') {
    const temp_ip = raw_request.socket.remoteAddress;
    if (is_ip(temp_ip) === true) {
      ip = temp_ip;
    }
  }

  if (typeof raw_request.headers['x-forwarded-for'] === 'string') {
    const temp_ip = raw_request.headers['x-forwarded-for'].split(/\s*,\s*/)[0];
    if (is_ip(temp_ip) === true) {
      ip = temp_ip;
    }
  }

  if (ip.substring(0, 7) === '::ffff:' && is_ip.v4(ip.substring(8)) === true) {
    ip = ip.substring(7);
  }

  return ip;
};

const get_request_user_agent = (raw_request) => {
  let ua = '';
  if (typeof raw_request.headers['user-agent'] === 'string') {
    ua = raw_request.headers['user-agent'];
  }
  return ua;
};

const referrer_policies = new Set(['no-referrer', 'same-origin']);
const x_dns_prefetch_controls = new Set(['off', 'on']);

function EndpointServer(config) {

  if (typeof config !== 'object' || config === null) {
    throw new Error('new EndpointServer(config), "config" must be an object.');
  }
  if (typeof config.use_compression !== 'boolean') {
    throw new Error('new EndpointServer(config), "config.use_compression" must be a boolean.');
  }
  if (typeof config.use_session_id !== 'boolean') {
    throw new Error('new EndpointServer(config), "config.use_session_id" must be a boolean.');
  }
  if (Number.isInteger(config.session_max_age) === false || config.session_max_age < 0) {
    throw new Error('new EndpointServer(config), "config.session_max_age" must be an integer >= 0.');
  }
  if (typeof config.use_websocket !== 'boolean') {
    throw new Error('new EndpointServer(config), "config.use_websocket" must be a boolean.');
  }
  if (typeof config.use_stack_trace !== 'boolean') {
    throw new Error('new EndpointServer(config), "config.use_stack_trace" must be a boolean.');
  }
  if (typeof config.referrer_policy !== 'string' || referrer_policies.has(config.referrer_policy) === false) {
    throw new Error('new EndpointServer(config), "config.referrer_policy" must be "no-referrer" or "same-origin"');
  }
  if (typeof config.x_dns_prefetch_control !== 'string' || x_dns_prefetch_controls.has(config.x_dns_prefetch_control) === false) {
    throw new Error('new EndpointServer(config), "config.x_dns_prefetch_control" must be "off" or "on"');
  }


  const endpoint = this;

  const static_map = new Map();
  const cache_control_map = new Map();

  endpoint.static = (endpoint_directory, local_directory, cache_control) => {
    if (typeof endpoint_directory !== 'string') {
      throw new Error('EndpointServer.static(endpoint_directory, local_directory, cache_control), "dir" must be a string.');
    }
    if (endpoint_directory.substring(0, 1) !== '/') {
      throw new Error('EndpointServer.static(endpoint_directory, local_directory, cache_control), "dir" must have leading slash.');
    }
    if (endpoint_directory.length > 1 && endpoint_directory.substring(endpoint_directory.length - 1, endpoint_directory.length) === '/') {
      throw new Error('EndpointServer.static(endpoint_directory, local_directory, cache_control), "dir" must not have trailing slash.');
    }
    if (typeof local_directory !== 'string') {
      throw new Error('EndpointServer.static(endpoint_directory, local_directory, cache_control), "local_directory" must be a string.');
    }
    if (local_directory.substring(0, 1) !== '/') {
      throw new Error('EndpointServer.static(endpoint_directory, local_directory, cache_control), "local_directory" must have leading slash.');
    }
    if (local_directory.length > 1 && local_directory.substring(local_directory.length - 1, local_directory.length) === '/') {
      throw new Error('EndpointServer.static(endpoint_directory, local_directory, cache_control), "local_directory" must not have trailing slash.');
    }
    if (cache_control !== undefined && typeof cache_control !== 'string') {
      throw new Error('EndpointServer.static(endpoint_directory, local_directory, cache_control), "cache_control" must be a string.');
    }
    static_map.set(endpoint_directory, local_directory);
    if (cache_control !== undefined) {
      cache_control_map.set(endpoint_directory, cache_control);
    }
  };

  const routes_map = new Map();

  http_methods.forEach((http_method) => {
    const route_map = new Map();
    endpoint[http_method.toLowerCase()] = (path, handler) => {
      if (typeof path !== 'string') {
        throw new Error('EndpointServer.http_method(path, handler), "path" must be a string.');
      }
      if (typeof handler !== 'function') {
        throw new Error('EndpointServer.http_method(path, handler), "handler" must be a function.');
      }
      if (path !== '*' && path.substring(0, 1) !== '/') {
        throw new Error('EndpointServer.http_method(path, handler), "path" must have leading slash.');
      }
      if (path.length > 1 && path.substring(path.length - 1, path.length) === '/') {
        throw new Error('EndpointServer.http_method(path, handler), "path" must not have trailing slash.');
      }
      if (route_map.has(path) === false) {
        route_map.set(path, [handler]);
      } else {
        route_map.get(path).push(handler);
      }
    };
    routes_map.set(http_method, route_map);
  });

  const request_listener = async (raw_request, raw_response) => {

    const ip = get_request_ip_address(raw_request);
    const ua = get_request_user_agent(raw_request);

    const endpoint_request = {
      ip,
      ua,
      encrypted: raw_request.socket.encrypted === true,
      method: raw_request.method,
      headers: raw_request.headers,
      url: url.parse(raw_request.url, true),
      sid: null,
    };

    const endpoint_response = {
      code: 200,
      headers: {
        'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload;',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer', // can be "same-origin"
        'X-DNS-Prefetch-Control': 'off', // can be "on"
        'Content-Security-Policy': 'default-src https:; upgrade-insecure-requests; connect-src https: \'self\'; img-src https: \'self\'; script-src https: \'unsafe-inline\'; style-src https: \'unsafe-inline\';', // can be edited
        'Content-Type': 'application/json',
      },
      body: {}
    };

    if (http_methods.has(endpoint_request.method) === false) {
      return prepare_response(endpoint_request, raw_response, endpoint_response, config, new HTTPError(405));
    }

    if (config.use_session_id === true) {
      if (endpoint_request.headers.cookie === undefined) {
        endpoint_request.sid = crypto.randomBytes(32).toString('hex');
        endpoint_response.headers['Set-Cookie'] = `sid=${endpoint_request.sid}; Path=/; SameSite=Strict;`;
        if (config.session_max_age > 0) {
          endpoint_response.headers['Set-Cookie'] += ` Max-Age=${config.session_max_age};`;
        }
        if (endpoint_request.encrypted === true) {
          endpoint_response.headers['Set-Cookie'] += ' Secure;';
        }
      } else {
        const cookies = cookie.parse(endpoint_request.headers.cookie);
        if (cookies.sid === undefined) {
          endpoint_request.sid = crypto.randomBytes(32).toString('hex');
          endpoint_response.headers['Set-Cookie'] = `sid=${endpoint_request.sid}; Path=/; SameSite=Strict;`;
          if (config.session_max_age > 0) {
            endpoint_response.headers['Set-Cookie'] += `Max-Age=${config.session_max_age};`;
          }
          if (endpoint_request.encrypted === true) {
            endpoint_response.headers['Set-Cookie'] += ' Secure;';
          }
        } else {
          endpoint_request.sid = cookies.sid;
        }
      }
    }

    if (endpoint_request.method === 'HEAD' || endpoint_request.method === 'GET') {
      const ext = extname(endpoint_request.url.pathname);
      if (ext !== '') {
        const endpoint_directory = dirname(endpoint_request.url.pathname);
        if (static_map.has(endpoint_directory) === false) {
          return prepare_response(endpoint_request, raw_response, endpoint_response, config, new HTTPError(404));
        }
        const local_directory = static_map.get(endpoint_directory);

        const file_basename = basename(endpoint_request.url.pathname);
        const file_path = join(local_directory, file_basename);

        try {
          await fs.promises.access(file_path);
        } catch (e) {
          return prepare_response(endpoint_request, raw_response, endpoint_response, config, new HTTPError(404));
        }

        const file_content_type = mime.contentType(file_basename);
        if (file_content_type === false) {
          return prepare_response(endpoint_request, raw_response, endpoint_response, config, new HTTPError(400));
        }

        const file_content_buffer = await fs.promises.readFile(file_path);
        if (cache_control_map.has(endpoint_directory) === true) {
          endpoint_response.headers['Cache-Control'] = cache_control_map.get(endpoint_directory);
        }
        endpoint_response.headers['Content-Type'] = file_content_type;
        endpoint_response.body = file_content_buffer;
        return prepare_response(endpoint_request, raw_response, endpoint_response, config);
      }
    }

    const route_map = routes_map.get(endpoint_request.method);

    let handlers = route_map.get(endpoint_request.url.pathname);

    // catch-all "*" for HEAD and GET does not affect explicit GET routes
    // this means middlewares for catch-all "*" and explicit GET routes are applied separately
    if (endpoint_request.method === 'HEAD' || endpoint_request.method === 'GET') {
      if (handlers === undefined) {
        handlers = route_map.get('*');
      }
    }

    if (handlers !== undefined) {

      if (endpoint_request.headers['content-type'] !== undefined) {

        if (endpoint_request.headers['content-type'].includes('application/json') === true) {
          let buffer = Buffer.alloc(0);
          raw_request.on('data', (chunk) => {
            buffer = Buffer.concat([buffer, chunk]);
          });
          raw_request.on('end', () => {
            try {
              endpoint_request.body = JSON.parse(buffer.toString());
              endpoint_request.body_buffer = buffer;
            } catch (e) {
              return prepare_response(endpoint_request, raw_response, endpoint_response, config, new HTTPError(400));
            }
            return handle_request(endpoint_request, raw_response, endpoint_response, handlers, config);
          });
          return;
        } else {
          if (endpoint_request.headers['content-type'].includes('multipart/form-data') === true || endpoint_request.headers['content-type'].includes('application/x-www-form-urlencoded') === true) {
            const busboy = new Busboy({ headers: endpoint_request.headers, limits: { fieldSize: Infinity } });
            endpoint_request.body = {};
            endpoint_request.files = [];
            busboy.on('file', (fieldname, file, fileName, encoding, mimeType) => {
              let buffer = Buffer.alloc(0);
              file.on('data', (data) => {
                buffer = Buffer.concat([buffer, data]);
              });
              file.on('end', () => {
                switch (fieldname) {
                  case 'body': {
                    if (mimeType === 'application/json') {
                      endpoint_request.body = JSON.parse(buffer.toString());
                    }
                    break;
                  }
                  case 'files': {
                    endpoint_request.files.push({ file: buffer, fieldname, fileName, encoding, mimeType, });
                    break;
                  }
                  default: {
                    break;
                  }
                }
              });
            });
            busboy.on('field', (fieldname, val) => {
              endpoint_request.body[fieldname] = val;
            });
            busboy.on('finish', async () => {
              return handle_request(endpoint_request, raw_response, endpoint_response, handlers, config);
            });
            return raw_request.pipe(busboy);
          }
        }
      }

      return handle_request(endpoint_request, raw_response, endpoint_response, handlers, config);
    }

    return prepare_response(endpoint_request, raw_response, endpoint_response, config, new HTTPError(404));
  };

  this.http_server = null;
  this.http = (port, callback) => {
    const http_server = http.createServer(request_listener);
    http_server.on('close', () => console.error('Server closed'));
    http_server.on('error', (e) => console.error('Server error', e.message));
    http_server.listen(port, callback);
    this.http_server = http_server;
  };

  this.https_server = null;
  this.websocket_server = null;
  this.https = (port, key, cert, ca, callback) => {
    const https_server = https.createServer({ key, cert, ca }, request_listener);
    https_server.on('close', () => console.error('Server closed'));
    https_server.on('error', (e) => console.error('Server error', e.message));
    if (config.use_websocket === true && typeof config.on_websocket_connection === 'function') {
      const websocket_server = new WebSocket.Server({ server: https_server });
      const websocket_client_is_alive = new WeakMap();
      websocket_server.on('connection', async (websocket_client, raw_request) => {
        websocket_client.ip = get_request_ip_address(raw_request);
        websocket_client.ua = get_request_user_agent(raw_request);
        websocket_client_is_alive.set(websocket_client, true);
        websocket_client.on('pong', () => websocket_client_is_alive.set(websocket_client, true));
        config.on_websocket_connection(websocket_client);
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

const cwd = process.cwd();

const path_from_cwd = (path) => {
  if (typeof path !== 'string') {
    throw new Error('path_from_cwd(path), "path" must be a string.');
  }
  if (isAbsolute(path) === false) {
    throw new Error('path_from_cwd(path), "path" must be an absolute path.');
  }
  return join(cwd, path);
};

module.exports = { EndpointServer, HTTPError, path_from_cwd };
