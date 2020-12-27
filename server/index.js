
const fs = require('fs');
const url = require('url');
const zlib = require('zlib');
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const stream = require('stream');
const assert = require('assert');
const { extname, dirname, basename, join, isAbsolute } = require('path');
const emitter = require('../extras/common/emitter');

const statuses = require('statuses');
const mime = require('mime-types');
const cookie = require('cookie');
const Busboy = require('busboy');
const is_ip = require('is-ip');
const WebSocket = require('ws');

class HTTPError extends Error {
  constructor (code, message, internal_error) {
    super(message);

    assert(typeof code === 'number' && Number.isFinite(code) === true);
    assert(message === null || typeof message === 'string');
    assert(internal_error === null || internal_error instanceof Error);

    if (Error.captureStackTrace instanceof Function) {
      Error.captureStackTrace(this, HTTPError);
    }

    this.code = code;
    this.status = statuses.message[code] || null;
    this.message = message;
    this.internal_error = internal_error;
  }

  static assert(value, code, message) {
    try {
      assert(typeof value === 'boolean');
      assert(typeof code === 'number' && Number.isFinite(code) === true);
      assert(message === null || typeof message === 'string');
      assert(value === true);
    } catch (assertion_error) {
      throw new HTTPError(code, message, assertion_error);
    }
  }
}

const send_buffer_response = (config, endpoint_request, raw_response, endpoint_response) => {
  if (config.use_stack_trace === true) {
    console.log('@send_buffer_response');
  }
  if (endpoint_request.method === 'HEAD' || endpoint_request.method === 'GET') {
    if (endpoint_response.headers['Cache-Control'] !== 'no-store') {
      endpoint_response.headers['ETag'] = crypto.createHash('sha256').update(endpoint_response.buffer).digest('hex');
      if (endpoint_request.headers['if-none-match'] === endpoint_response.headers['ETag']) {
        endpoint_response.code = 304;
      }
    }
  }
  if (endpoint_request.method === 'HEAD' || endpoint_response.code === 304) {
    endpoint_response.buffer = null;
  }
  if (endpoint_response.buffer !== null) {
    raw_response.writeHead(endpoint_response.code, endpoint_response.headers).end(endpoint_response.buffer);
    return;
  }
  raw_response.writeHead(endpoint_response.code, endpoint_response.headers).end();
};

const compress_buffer_response = (config, endpoint_request, raw_response, endpoint_response) => {
  if (config.use_stack_trace === true) {
    console.log('@compress_buffer_response');
  }
  if (config.use_compression === true) {
    if (endpoint_request.headers['accept-encoding'] !== undefined) {

      let compression_content_encoding = null;
      let compression_buffer_transform = null;

      if (endpoint_request.headers['accept-encoding'].includes('br') === true) {
        compression_content_encoding = 'br';
        compression_buffer_transform = zlib.brotliCompress;
      } else if (endpoint_request.headers['accept-encoding'].includes('gzip') === true) {
        compression_content_encoding = 'gzip';
        compression_buffer_transform = zlib.gzip;
      }

      if (compression_content_encoding !== null) {
        if (Buffer.isBuffer(endpoint_response.buffer) === false) {
          endpoint_response.error = new HTTPError(500, null, 'endpoint_response.buffer must be a buffer.');
          prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
          return;
        }
        compression_buffer_transform(endpoint_response.buffer, (compression_error, compression_buffer_output) => {
          if (compression_error !== null) {
            endpoint_response.error = new HTTPError(500, null, compression_error);
            prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
            return;
          }
          endpoint_response.buffer = compression_buffer_output;
          endpoint_response.headers['Content-Length'] = compression_buffer_output.byteLength;
          endpoint_response.headers['Content-Encoding'] = compression_content_encoding;
          send_buffer_response(config, endpoint_request, raw_response, endpoint_response);
        });
        return;
      }
    }
  }
  endpoint_response.headers['Content-Length'] = endpoint_response.buffer.byteLength;
  send_buffer_response(config, endpoint_request, raw_response, endpoint_response);
};

const send_stream_response = (config, endpoint_request, raw_response, endpoint_response) => {
  if (config.use_stack_trace === true) {
    console.log('@send_stream_response');
  }
  if (endpoint_request.method === 'HEAD' || endpoint_request.method === 'GET') {
    if (endpoint_response.headers['Cache-Control'] !== 'no-store') {
      if (endpoint_response.stream_etag !== null) {
        endpoint_response.headers['ETag'] = endpoint_response.stream_etag;
        if (endpoint_request.headers['if-none-match'] === endpoint_response.headers['ETag']) {
          endpoint_response.code = 304;
        }
      }
    }
  }
  if (endpoint_request.method === 'HEAD' || endpoint_response.code === 304) {
    endpoint_response.buffer = null;
    raw_response.writeHead(endpoint_response.code, endpoint_response.headers).end();
    return;
  }

  raw_response.writeHead(endpoint_response.code, endpoint_response.headers);
  fs.createReadStream(endpoint_response.stream_source_path).pipe(raw_response);
};

const file_mtimems_cache = new Map();
const file_length_cache = new Map();
const file_etag_cache = new Map();

const compress_stream_response = (config, endpoint_request, raw_response, endpoint_response) => {
  if (config.use_stack_trace === true) {
    console.log('@compress_stream_response');
  }
  if (config.use_compression === true) {
    if (endpoint_request.headers['accept-encoding'] !== undefined) {

      let compression_content_encoding = null;
      let compression_stream_transform = null;

      if (endpoint_request.headers['accept-encoding'].includes('br') === true) {
        compression_content_encoding = 'br';
        compression_stream_transform = zlib.createBrotliCompress;
      } else if (endpoint_request.headers['accept-encoding'].includes('gzip') === true) {
        compression_content_encoding = 'gzip';
        compression_stream_transform = zlib.createGzip;
      }

      if (compression_content_encoding !== null) {

        fs.stat(endpoint_response.stream_raw_path, (raw_file_stat_error, raw_file_stat) => {

          if (raw_file_stat_error !== null) {
            endpoint_response.error = new HTTPError(500, null, raw_file_stat_error);
            prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
            return;
          }

          const compressed_file_id = crypto.createHash('sha1').update(endpoint_response.stream_raw_path).digest('hex').concat('.', compression_content_encoding);
          const compressed_file_path = join('/tmp', compressed_file_id);

          if (file_mtimems_cache.get(compressed_file_id) === raw_file_stat.mtimeMs) {
            endpoint_response.headers['Content-Length'] = file_length_cache.get(compressed_file_id);
            endpoint_response.headers['Content-Encoding'] = compression_content_encoding;
            endpoint_response.stream_etag = file_etag_cache.get(compressed_file_id);
            endpoint_response.stream_source_path = compressed_file_path;
            send_stream_response(config, endpoint_request, raw_response, endpoint_response);
            return;
          }

          let compressed_file_length = 0;
          let compressed_file_hash = crypto.createHash('sha256');

          endpoint_response.headers['Content-Encoding'] = compression_content_encoding;
          raw_response.writeHead(endpoint_response.code, endpoint_response.headers);

          const hash_stream_passthrough = new stream.PassThrough()
            .on('data', (chunk) => {
              compressed_file_length += chunk.byteLength;
              compressed_file_hash.update(chunk);
              raw_response.write(chunk);
            })
            .on('end', () => {
              compressed_file_hash = compressed_file_hash.digest('hex');
              raw_response.end();
            });

          fs.createReadStream(endpoint_response.stream_raw_path)
            .pipe(compression_stream_transform())
            .pipe(hash_stream_passthrough)
            .pipe(fs.createWriteStream(compressed_file_path, { emitClose: true }))
            .on('close', () => {
              file_mtimems_cache.set(compressed_file_id, raw_file_stat.mtimeMs);
              file_length_cache.set(compressed_file_id, compressed_file_length);
              file_etag_cache.set(compressed_file_id, compressed_file_hash);
            });
        });

        return;
      }
    }
  }

  fs.stat(endpoint_response.stream_raw_path, (raw_file_stat_error, raw_file_stat) => {

    if (raw_file_stat_error !== null) {
      endpoint_response.error = new HTTPError(500, null, raw_file_stat_error);
      prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
      return;
    }

    const raw_file_id = crypto.createHash('sha1').update(endpoint_response.stream_raw_path).digest('hex');
    const raw_file_path = endpoint_response.stream_raw_path;

    if (file_mtimems_cache.get(raw_file_id) === raw_file_stat.mtimeMs) {
      endpoint_response.headers['Content-Length'] = raw_file_stat.size;
      endpoint_response.stream_etag = file_etag_cache.get(raw_file_id);
      endpoint_response.stream_source_path = raw_file_path;
      send_stream_response(config, endpoint_request, raw_response, endpoint_response);
      return;
    }
    let raw_file_hash = crypto.createHash('sha256');

    raw_response.writeHead(endpoint_response.code, endpoint_response.headers);

    const hash_stream_passthrough = new stream.PassThrough()
      .on('data', (chunk) => {
        raw_file_hash.update(chunk);
        raw_response.write(chunk);
      })
      .on('end', () => {
        raw_file_hash = raw_file_hash.digest('hex');
        raw_response.end();
      });

    fs.createReadStream(endpoint_response.stream_raw_path)
      .pipe(hash_stream_passthrough)
      .on('close', () => {
        file_mtimems_cache.set(raw_file_id, raw_file_stat.mtimeMs);
        file_etag_cache.set(raw_file_id, raw_file_hash);
      });

  });
};

const prepare_response_error = (config, endpoint_request, raw_response, endpoint_response) => {
  if (config.use_stack_trace === true) {
    console.log('@prepare_response_error');
  }
  if (endpoint_response.error !== null) {
    if (endpoint_response.error instanceof HTTPError === false) {
      endpoint_response.error = new HTTPError(500, null, new Error('endpoint_response.error must be an instance of HTTPError.'));
    }
    if (config.use_stack_trace === true) {
      console.error('---');
      console.error('--- endpoint_request:');
      console.error(endpoint_request);
      console.error('--- endpoint_response:');
      console.error(endpoint_response);
      console.error('--- endpoint_response.error:');
      console.error(endpoint_response.error);
      console.error('--- endpoint_response.error.internal_error:');
      console.error(endpoint_response.error.internal_error);
    }
    endpoint_response.code = endpoint_response.error.code;
    endpoint_response.headers = { ...endpoint_response.default_headers, 'Content-Type': 'application/json; charset=utf-8' };

    const endpoint_response_json = {
      error: {
        code: endpoint_response.error.code,
        status: endpoint_response.error.status,
        message: endpoint_response.error.message,
        timestamp: new Date().toUTCString(),
      },
    };

    endpoint_response.json = null;
    endpoint_response.text = null;
    endpoint_response.html = null;
    endpoint_response.filename = null;
    endpoint_response.buffer = null;
    endpoint_response.stream = null;
    endpoint_response.stream_raw_path = null;
    endpoint_response.stream_source_path = null;
    endpoint_response.stream_etag = null;
    endpoint_response.error = null;

    endpoint_response.buffer = Buffer.from(JSON.stringify(endpoint_response_json));
  }
  compress_buffer_response(config, endpoint_request, raw_response, endpoint_response);
};

const accepted_http_methods = new Set(['HEAD', 'GET', 'POST', 'PUT', 'DELETE']);
const accepted_redirect_codes = new Set([301, 302, 307, 308]);

const prepare_response = (config, endpoint_request, raw_response, endpoint_response) => {
  if (config.use_stack_trace === true) {
    console.log('@prepare_response');
  }
  if (endpoint_response.error !== null) {
    prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
    return;
  }

  if (endpoint_response.headers.Location !== undefined) {
    if (accepted_redirect_codes.has(endpoint_response.code) === false) {
      endpoint_response.error = new HTTPError(500, null, new Error('endpoint_response.code must be 301/302/307/308.'));
      prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
      return;
    }
    if (typeof endpoint_response.headers.Location !== 'string') {
      endpoint_response.error = new HTTPError(500, null, 'endpoint_response.headers.Location must be a string.');
      prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
      return;
    }
    raw_response.writeHead(endpoint_response.code, endpoint_response.headers).end();
    return;
  }

  if (endpoint_response.json !== null) {
    if (typeof endpoint_response.json !== 'object') {
      endpoint_response.error = new HTTPError(500, null, new Error('endpoint_response.json must be an object.'));
      prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
      return;
    }
    endpoint_response.text = JSON.stringify(endpoint_response.json);
    if (endpoint_response.headers['Content-Type'] === undefined) {
      endpoint_response.headers['Content-Type'] = 'application/json; charset=utf-8';
    }
    endpoint_response.json = null;
  }

  if (endpoint_response.html !== null) {
    if (endpoint_response.text !== null) {
      endpoint_response.error = new HTTPError(500, null, new Error('endpoint_response.html cannot be used with endpoint_response.text.'));
      prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
      return;
    }
    if (typeof endpoint_response.html !== 'string') {
      endpoint_response.error = new HTTPError(500, null, new Error('endpoint_response.html must be a string.'));
      prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
      return;
    }
    endpoint_response.buffer = Buffer.from(endpoint_response.html);
    if (endpoint_response.headers['Content-Type'] === undefined) {
      endpoint_response.headers['Content-Type'] = 'text/html; charset=utf-8';
    }
    if (endpoint_response.headers['Content-Security-Policy'] === undefined) {
      if (endpoint_request.is_https_available === true) {
        endpoint_response.headers['Content-Security-Policy'] = `upgrade-insecure-requests; default-src ${endpoint_request.protocol}://${endpoint_request.headers.host};`;
      } else {
        endpoint_response.headers['Content-Security-Policy'] = `default-src ${endpoint_request.protocol}://${endpoint_request.headers.host};`;
      }
    }
    endpoint_response.html = null;
  }

  if (endpoint_response.text !== null) {
    if (typeof endpoint_response.text !== 'string') {
      endpoint_response.error = new HTTPError(500, null, new Error('endpoint_response.text must be a string.'));
      prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
      return;
    }
    endpoint_response.buffer = Buffer.from(endpoint_response.text);
    if (endpoint_response.headers['Content-Type'] === undefined) {
      endpoint_response.headers['Content-Type'] = 'text/plain; charset=utf-8';
    }
    endpoint_response.text = null;
  }

  if (endpoint_response.filename !== null) {
    if (typeof endpoint_response.filename !== 'string') {
      endpoint_response.error = new HTTPError(500, null, new Error('endpoint_response.filename must be a string.'));
      prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
      return;
    }
    if (endpoint_response.headers['Content-Disposition'] === undefined) {
      endpoint_response.headers['Content-Disposition'] = `attachment; filename="${endpoint_response.filename}"`;
    }
  }

  if (endpoint_response.buffer !== null || endpoint_response.stream_raw_path !== null) {
    if (endpoint_response.headers['Content-Type'] === undefined) {
      endpoint_response.headers['Content-Type'] = 'application/octet-stream';
    }
  }

  if (endpoint_response.headers['Content-Security-Policy'] === undefined) {
    if (endpoint_request.is_https_available === true) {
      endpoint_response.headers['Content-Security-Policy'] = 'upgrade-insecure-requests; default-src \'none\';';
    } else {
      endpoint_response.headers['Content-Security-Policy'] = 'default-src \'none\';';
    }
  }

  if (endpoint_response.buffer !== null) {
    compress_buffer_response(config, endpoint_request, raw_response, endpoint_response);
    return;
  }
  if (endpoint_response.stream_raw_path !== null) {
    compress_stream_response(config, endpoint_request, raw_response, endpoint_response);
    return;
  }

  // allows sending of responses with empty body
  send_buffer_response(config, endpoint_request, raw_response, endpoint_response);
};

const handle_request = async (endpoint_request, raw_response, endpoint_response, handlers, config) => {
  if (config.use_stack_trace === true) {
    console.log('@handle_request');
  }
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
    prepare_response(config, endpoint_request, raw_response, endpoint_response);
    return;
  } catch (handler_error) {
    if (handler_error instanceof HTTPError) {
      endpoint_response.error = handler_error;
      prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
      return;
    }
    endpoint_response.error = new HTTPError(500, null, handler_error);
    prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
    return;
  }
};

const get_ip_address = (request) => {
  let ip_address = '';
  if (typeof request.socket === 'object' && typeof request.socket.remoteAddress === 'string') {
    const temp_ip = request.socket.remoteAddress;
    if (is_ip(temp_ip) === true) {
      ip_address = temp_ip;
    }
  }
  if (typeof request.headers['x-forwarded-for'] === 'string') {
    const temp_ip = request.headers['x-forwarded-for'].split(/\s*,\s*/)[0];
    if (is_ip(temp_ip) === true) {
      ip_address = temp_ip;
    }
  }
  if (ip_address.substring(0, 7) === '::ffff:' && is_ip.v4(ip_address.substring(8)) === true) {
    ip_address = ip_address.substring(7);
  }
  return ip_address;
};

const get_user_agent = (request) => {
  let user_agent = '';
  if (typeof request.headers['user-agent'] === 'string') {
    user_agent = request.headers['user-agent'];
  }
  return user_agent;
};

/**
 * @typedef {Object} Session
 * @property {String} session_id
 * @property {Object} session_data
 * @property {String|void} session_cookie
 */

/**
 * @type {Map<String, Session}
 */
const sessions = new Map();

/**
 * @type {WeakMap<http.IncomingMessage, Session>}
 */
const request_sessions = new WeakMap();

/**
 * @param {http.IncomingMessage} request
 */
const get_session = (request) => {
  if (typeof request.headers.cookie === 'string') {
    const cookies = cookie.parse(request.headers.cookie);
    if (typeof cookies.session_id === 'string') {
      const session_id = cookies.session_id;
      if (sessions.has(session_id) === false) {
        const session = { session_id, session_data: { user: null } };
        sessions.set(session_id, session);
      }
      const session = sessions.get(session_id);
      request_sessions.set(request, session);
      return session;
    }
  }
  const session_id = crypto.randomBytes(32).toString('hex');
  const session_cookie = cookie.serialize('session_id', session_id, {
    path: '/',
    sameSite: 'strict',
    secure: request.socket.encrypted === true,
  });
  const session = { session_id, session_data: { user: null }, session_cookie };
  sessions.set(session_id, session);
  request_sessions.set(request, session);
  return session;
};

const valid_referrer_policies = new Set(['no-referrer', 'same-origin']);
const valid_x_dns_prefetch_control = new Set(['off', 'on']);
const valid_tls_min_version = new Set(['TLSv1.3', 'TLSv1.2']);

function EndpointServer(config) {

  assert(config instanceof Object);
  assert(typeof config.use_compression === 'boolean');

  assert(typeof config.use_websocket === 'boolean');
  assert(typeof config.use_stack_trace === 'boolean');
  assert(typeof config.referrer_policy === 'string');
  assert(valid_referrer_policies.has(config.referrer_policy) === true);

  assert(typeof config.x_dns_prefetch_control === 'string');
  assert(valid_x_dns_prefetch_control.has(config.x_dns_prefetch_control) === true);

  const static_map = new Map();
  const cache_control_map = new Map();
  let is_https_available = false;

  this.emitter = new emitter();

  this.static = (endpoint_directory, local_directory, cache_control) => {

    // validate endpoint_directory
    assert(typeof endpoint_directory === 'string');
    assert(isAbsolute(endpoint_directory) === true);

    // validate local_directory
    assert(typeof local_directory === 'string');
    assert(isAbsolute(local_directory) === true);
    assert(fs.existsSync(local_directory) === true);
    fs.accessSync(local_directory, fs.constants.R_OK);
    const local_directory_stat = fs.statSync(local_directory);
    assert(local_directory_stat.isDirectory() === true);

    // validate cache_control
    assert(cache_control === undefined || typeof cache_control === 'string');

    static_map.set(endpoint_directory, local_directory);
    if (typeof cache_control === 'string') {
      cache_control_map.set(endpoint_directory, cache_control);
    }
  };

  const routes_map = new Map();
  accepted_http_methods.forEach((http_method) => {
    const route_map = new Map();
    this[http_method.toLowerCase()] = (path, handler) => {
      assert(typeof path === 'string');
      assert(handler instanceof Function);
      if (path !== '*') {
        assert(path.substring(0, 1) === '/'); // must have leading slash
        assert(path.substring(path.length - 1, path.length) !== '/'); // must not have trailing slash
      }
      if (route_map.has(path) === false) {
        route_map.set(path, [handler]);
      } else {
        route_map.get(path).push(handler);
      }
    };
    routes_map.set(http_method, route_map);
  });

  const create_websocket_server = (http_server) => {
    assert(http_server instanceof Object);
    const websocket_server = new WebSocket.Server({ server: http_server });
    const websocket_client_is_alive = new WeakMap();

    websocket_server.on('headers', (headers, request) => {
      const session = get_session(request);
      if (typeof session.session_cookie === 'string') {
        headers.push(`Set-Cookie: ${session.session_cookie}`);
        delete session.session_cookie;
      }
    });

    websocket_server.on('connection', (websocket_client, request) => {
      const endpoint_request = {
        ip_address: get_ip_address(request),
        user_agent: get_user_agent(request),
        encrypted: request.socket.encrypted === true,
        headers: request.headers,
      };
      const session = get_session(request);
      endpoint_request.session = session.session_data;
      websocket_client_is_alive.set(websocket_client, true);
      websocket_client.on('pong', () => websocket_client_is_alive.set(websocket_client, true));
      this.emitter.emit('websocket_connection', websocket_client, endpoint_request);
    });
    setInterval(() => websocket_server.clients.forEach((websocket_client) => {
      if (websocket_client_is_alive.get(websocket_client) === false) {
        websocket_client.terminate();
        return;
      }
      websocket_client_is_alive.set(websocket_client, false);
      try {
        websocket_client.ping(() => {});
      } catch (websocket_ping_error) {
        console.error(websocket_ping_error);
      }
    }), 30000);
  };

  /**
   * @param {http.IncomingMessage} request
   * @param {http.OutgoingMessage} raw_response
   */
  const request_listener = async (request, raw_response) => {
    if (config.use_stack_trace === true) {
      console.log('@', new Date().toUTCString());
      console.log('@request_listener');
    }

    const ip_address = get_ip_address(request);
    const user_agent = get_user_agent(request);
    const endpoint_request = {
      ip_address,
      user_agent,
      protocol: request.socket.encrypted === true ? 'https' : 'http',
      encrypted: request.socket.encrypted === true,
      method: request.method,
      headers: request.headers,
      url: url.parse(request.url, true),
      session_id: null,
      is_https_available,
    };

    if (config.use_stack_trace === true) {
      console.log(endpoint_request.method, endpoint_request.url.pathname);
    }

    const default_headers = {
      'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload;',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': config.referrer_policy,
      'X-DNS-Prefetch-Control': config.x_dns_prefetch_control,
      'Cache-Control': 'no-store',
    };

    const endpoint_response = {
      code: 200,
      headers: { ...default_headers },
      default_headers,
      json: null,
      text: null,
      html: null,
      filename: null,
      buffer: null,
      stream: null,
      stream_raw_path: null,
      stream_source_path: null,
      stream_etag: null,
      error: null,
    };

    if (accepted_http_methods.has(endpoint_request.method) === false) {
      endpoint_response.error = new HTTPError(405, null, null);
      prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
      return;
    }

    // insecure GET & HEAD to secure GET & HEAD
    if (is_https_available === true && endpoint_request.encrypted === false) {
      if (endpoint_request.method === 'GET' || endpoint_request.method === 'HEAD') {
        endpoint_response.code = 308;
        endpoint_response.headers.Location = `https://${endpoint_request.headers.host}${endpoint_request.url.path}`;
        prepare_response(config, endpoint_request, raw_response, endpoint_response);
        return;
      }
      // disallow other insecure requests
      endpoint_response.error = new HTTPError(405, null, null);
      prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
      return;
    }

    const session = get_session(request);
    if (typeof session.session_cookie === 'string') {
      endpoint_response.headers['Set-Cookie'] = session.session_cookie;
      delete session.session_cookie;
    }
    endpoint_request.session = session.session_data;

    if (endpoint_request.method === 'HEAD' || endpoint_request.method === 'GET') {
      const ext = extname(endpoint_request.url.pathname);
      if (ext !== '') {
        const endpoint_directory = dirname(endpoint_request.url.pathname);
        if (static_map.has(endpoint_directory) === false) {
          endpoint_response.error = new HTTPError(404, null, null);
          prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
          return;
        }
        const local_directory = static_map.get(endpoint_directory);

        const file_basename = basename(endpoint_request.url.pathname);
        const file_path = join(local_directory, file_basename);

        try {
          await fs.promises.access(file_path);
        } catch (file_access_error) {
          endpoint_response.error = new HTTPError(404, null, file_access_error);
          prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
          return;
        }

        const file_content_type = mime.contentType(file_basename);
        if (file_content_type === false) {
          endpoint_response.error = new HTTPError(400, null, null);
          prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
          return;
        }

        if (cache_control_map.has(endpoint_directory) === true) {
          endpoint_response.headers['Cache-Control'] = cache_control_map.get(endpoint_directory);
        }
        endpoint_response.headers['Content-Type'] = file_content_type;
        endpoint_response.stream_raw_path = file_path;
        prepare_response(config, endpoint_request, raw_response, endpoint_response);
        return;
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
          request.on('data', (chunk) => {
            buffer = Buffer.concat([buffer, chunk]);
          });
          request.on('end', () => {
            try {
              endpoint_request.body = JSON.parse(buffer.toString());
              endpoint_request.body_buffer = buffer;
            } catch (json_parsing_error) {
              endpoint_response.error = new HTTPError(400, null, json_parsing_error);
              prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
              return;
            }
            handle_request(endpoint_request, raw_response, endpoint_response, handlers, config);
            return;
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
                    endpoint_request.files.push({ file: buffer, fieldname, fileName, encoding, mimeType });
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
            busboy.on('finish', () => {
              handle_request(endpoint_request, raw_response, endpoint_response, handlers, config);
            });
            request.pipe(busboy);
            return;
          }
        }
      }
      handle_request(endpoint_request, raw_response, endpoint_response, handlers, config);
      return;
    }

    endpoint_response.error = new HTTPError(404, null, null);
    prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
    return;
  };

  this.http_server = null;
  this.http_websocket_server = null;
  this.http = (port) => {
    assert(typeof port === 'number');
    assert(Number.isInteger(port) === true);
    const http_server = http.createServer(request_listener);
    http_server.on('close', () => {
      console.log('http_server CLOSED');
    });
    http_server.on('error', (http_server_error) => {
      console.error('http_server ERROR', http_server_error.message);
      console.error(http_server_error);
    });
    if (config.use_websocket === true) {
      const http_websocket_server = create_websocket_server(http_server);
      this.http_websocket_server = http_websocket_server;
    }
    http_server.listen(port, () => {
      console.log('https_server LISTEN', port);
    });
    this.http_server = http_server;
  };

  this.https_server = null;
  this.https_websocket_server = null;
  this.https = (port, key, cert, ca, tls_min_version, dhparam) => {
    assert(typeof port === 'number');
    assert(Number.isInteger(port) === true);
    assert(typeof key === 'string');
    assert(typeof cert === 'string');
    assert(typeof ca === 'string');
    assert(typeof tls_min_version === 'string');
    assert(valid_tls_min_version.has(tls_min_version) === true);
    assert(dhparam === undefined || typeof dhparam === 'string');
    const https_server_options = {
      key,
      cert,
      ca,
      minVersion: tls_min_version,
      maxVersion: 'TLSv1.3',
      ecdhCurve: 'auto',
      honorCipherOrder: true,
      secureOptions: crypto.constants.SSL_OP_NO_TICKET
        | crypto.constants.SSL_OP_NO_SSLv2
        | crypto.constants.SSL_OP_NO_SSLv3
        | crypto.constants.SSL_OP_NO_TLSv1
        | crypto.constants.SSL_OP_NO_TLSv1_1
        | crypto.constants.SSL_OP_CIPHER_SERVER_PREFERENCE
        | crypto.constants.SSL_OP_PRIORITIZE_CHACHA,
    };
    if (tls_min_version === 'TLSv1.3') {
      https_server_options.secureOptions |= crypto.constants.SSL_OP_NO_TLSv1_2;
    }
    if (dhparam !== undefined) {
      https_server_options.dhparam = dhparam;
    }
    const https_server = https.createServer(https_server_options, request_listener);
    https_server.on('close', () => {
      is_https_available = false;
      console.log('https_server CLOSED');
    });
    https_server.on('error', (https_server_error) => {
      console.error('https_server ERROR', https_server_error.message);
      console.error(https_server_error);
    });
    if (config.use_websocket === true) {
      const https_websocket_server = create_websocket_server(https_server);
      this.https_websocket_server = https_websocket_server;
    }
    https_server.listen(port, () => {
      is_https_available = true;
      console.log('https_server LISTEN', port);
    });
    this.https_server = https_server;
  };
}

const cwd = process.cwd();

const path_from_cwd = (path) => {
  assert(typeof path === 'string');
  assert(isAbsolute(path) === true);
  return join(cwd, path);
};

module.exports = { EndpointServer, HTTPError, path_from_cwd };
