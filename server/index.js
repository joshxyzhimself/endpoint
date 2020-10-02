
const fs = require('fs');
const url = require('url');
const zlib = require('zlib');
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const stream = require('stream');
const { extname, dirname, basename, join, isAbsolute } = require('path');

const statuses = require('statuses');
const mime = require('mime-types');
const cookie = require('cookie');
const Busboy = require('busboy');
const is_ip = require('is-ip');
const WebSocket = require('ws');

class HTTPError extends Error {
  constructor (code, message, stack) {
    super(message);

    if (Number.isInteger(code) === false) {
      throw new Error('new HTTPError(code, message), "code" must be an integer.');
    }
    if (message !== undefined && typeof message !== 'string') {
      throw new Error('new HTTPError(code, message), "message" must be a string.');
    }
    if (stack !== undefined) {
      this.stack = this.stack.concat('\n', stack);
      console.log(this.stack);
    }

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, HTTPError);
    }

    this.code = code;
    this.status = statuses.message[code] || 'Unknown';
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

const internals = {};

internals.send_buffer_response = (config, endpoint_request, raw_response, endpoint_response) => {
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
    raw_response.writeHead(endpoint_response.code, endpoint_response.headers).end();
    return;
  }
  raw_response.writeHead(endpoint_response.code, endpoint_response.headers).end(endpoint_response.buffer);
};

internals.compress_buffer_response = (config, endpoint_request, raw_response, endpoint_response) => {

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
          endpoint_response.error = new HTTPError(500, 'endpoint_response.buffer must be a buffer.');
          internals.prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
          return;
        }
        compression_buffer_transform(endpoint_response.buffer, (compression_error, compression_buffer_output) => {
          if (compression_error !== null) {
            endpoint_response.error = new HTTPError(500, compression_error.message, compression_error.stack);
            internals.prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
            return;
          }
          endpoint_response.buffer = compression_buffer_output;
          endpoint_response.headers['Content-Length'] = compression_buffer_output.byteLength;
          endpoint_response.headers['Content-Encoding'] = compression_content_encoding;
          internals.send_buffer_response(config, endpoint_request, raw_response, endpoint_response);
        });
        return;
      }
    }
  }
  endpoint_response.headers['Content-Length'] = endpoint_response.buffer.byteLength;
  internals.send_buffer_response(config, endpoint_request, raw_response, endpoint_response);
};


internals.send_stream_response = (config, endpoint_request, raw_response, endpoint_response) => {
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

internals.compress_stream_response = (config, endpoint_request, raw_response, endpoint_response) => {
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
            endpoint_response.error = new HTTPError(500, raw_file_stat_error.message, raw_file_stat_error.stack);
            internals.prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
            return;
          }

          const compressed_file_id = crypto.createHash('sha1').update(endpoint_response.stream_raw_path).digest('hex').concat('.', compression_content_encoding);
          const compressed_file_path = join('/tmp', compressed_file_id);

          if (file_mtimems_cache.get(compressed_file_id) === raw_file_stat.mtimeMs) {
            endpoint_response.headers['Content-Length'] = file_length_cache.get(compressed_file_id);
            endpoint_response.headers['Content-Encoding'] = compression_content_encoding;
            endpoint_response.stream_etag = file_etag_cache.get(compressed_file_id);
            endpoint_response.stream_source_path = compressed_file_path;
            internals.send_stream_response(config, endpoint_request, raw_response, endpoint_response);
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
      endpoint_response.error = new HTTPError(500, raw_file_stat_error.message, raw_file_stat_error.stack);
      internals.prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
      return;
    }

    const raw_file_id = crypto.createHash('sha1').update(endpoint_response.stream_raw_path).digest('hex');
    const raw_file_path = endpoint_response.stream_raw_path;

    if (file_mtimems_cache.get(raw_file_id) === raw_file_stat.mtimeMs) {
      endpoint_response.headers['Content-Length'] = raw_file_stat.size;
      endpoint_response.stream_etag = file_etag_cache.get(raw_file_id);
      endpoint_response.stream_source_path = raw_file_path;
      internals.send_stream_response(config, endpoint_request, raw_response, endpoint_response);
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

internals.prepare_response_error = (config, endpoint_request, raw_response, endpoint_response) => {
  if (endpoint_response.error !== null) {
    if (endpoint_response.error instanceof HTTPError === false) {
      endpoint_response.error = new HTTPError(500, 'endpoint_response.error must be an instance of HTTPError.');
      internals.prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
      return;
    }
    console.error(endpoint_response.error);
    endpoint_response.code = endpoint_response.error.code;
    endpoint_response.headers = {
      'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload;',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': config.referrer_policy,
      'X-DNS-Prefetch-Control': config.x_dns_prefetch_control,
      'Content-Security-Policy': 'default-src https:; upgrade-insecure-requests; connect-src https: \'self\'; img-src https: \'self\'; script-src https: \'unsafe-inline\'; style-src https: \'unsafe-inline\';', // can be edited
      'Content-Type': 'application/json; charset=utf-8',
    };
    endpoint_response.json = {
      error: {
        code: endpoint_response.error.code,
        status: endpoint_response.error.status,
        message: endpoint_response.error.message,
        stack: config.use_stack_trace === true ? endpoint_response.error.stack : null,
        timestamp: new Date().toISOString(),
      }
    };
    endpoint_response.text = JSON.stringify(endpoint_response.json);
    endpoint_response.json = null;
    endpoint_response.buffer = Buffer.from(endpoint_response.text);
    endpoint_response.text = null;
    endpoint_response.stream_raw_path = null;
    endpoint_response.stream_etag = null;
    endpoint_response.stream_source_path = null;
    endpoint_response.error = null;
  }
  internals.compress_buffer_response(config, endpoint_request, raw_response, endpoint_response);
};

const http_methods = new Set(['HEAD', 'GET', 'POST', 'PUT', 'DELETE']);
const accepted_redirect_codes = new Set([301, 302, 307, 308]);

internals.prepare_response = (config, endpoint_request, raw_response, endpoint_response) => {

  if (endpoint_response.error !== null) {
    internals.prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
    return;
  }

  if (endpoint_response.redirect !== null) {
    if (accepted_redirect_codes.has(endpoint_response.code) === false) {
      endpoint_response.error = new HTTPError(500, 'endpoint_response.code must be 301/302/307/308.');
      internals.prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
      return;
    }
    if (typeof endpoint_response.redirect !== 'string') {
      endpoint_response.error = new HTTPError(500, 'endpoint_response.redirect must be a string.');
      internals.prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
      return;
    }
    raw_response.writeHead(endpoint_response.code, { Location: endpoint_response.redirect }).end();
    return;
  }

  if (endpoint_response.json !== null) {
    if (typeof endpoint_response.json !== 'object') {
      endpoint_response.error = new HTTPError(500, 'endpoint_response.json must be an object.');
      internals.prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
      return;
    }
    endpoint_response.text = JSON.stringify(endpoint_response.json);
    if (endpoint_response.headers['Content-Type'] === undefined) {
      endpoint_response.headers['Content-Type'] = 'application/json; charset=utf-8';
    }
    endpoint_response.json = null;
  }

  if (endpoint_response.text !== null) {
    if (typeof endpoint_response.text !== 'string') {
      endpoint_response.error = new HTTPError(500, 'endpoint_response.text must be a string.');
      internals.prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
      return;
    }
    endpoint_response.buffer = Buffer.from(endpoint_response.text);
    if (endpoint_response.headers['Content-Type'] === undefined) {
      endpoint_response.headers['Content-Type'] = 'text/html; charset=utf-8';
    }
    endpoint_response.text = null;
  }

  if (endpoint_response.buffer !== null || endpoint_response.stream_raw_path !== null) {
    if (endpoint_response.headers['Content-Type'] === undefined) {
      endpoint_response.headers['Content-Type'] = 'application/octet-stream';
    }
  }

  if (endpoint_response.buffer !== null) {
    internals.compress_buffer_response(config, endpoint_request, raw_response, endpoint_response);
    return;
  }
  if (endpoint_response.stream_raw_path !== null) {
    internals.compress_stream_response(config, endpoint_request, raw_response, endpoint_response);
    return;
  }
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
    internals.prepare_response(config, endpoint_request, raw_response, endpoint_response);
    return;
  } catch (e) {
    if (e instanceof HTTPError) {
      endpoint_response.error = e;
      internals.prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
      return;
    }
    endpoint_response.error = new HTTPError(500, e.message, e.stack);
    internals.prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
    return;
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

const accepted_referrer_policies = new Set(['no-referrer', 'same-origin']);
const accepted_x_dns_prefetch_control = new Set(['off', 'on']);
const accepted_tls_min_version = new Set(['TLSv1.3', 'TLSv1.2']);

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
  if (typeof config.referrer_policy !== 'string' || accepted_referrer_policies.has(config.referrer_policy) === false) {
    throw new Error('new EndpointServer(config), "config.referrer_policy" must be "no-referrer" or "same-origin"');
  }
  if (typeof config.x_dns_prefetch_control !== 'string' || accepted_x_dns_prefetch_control.has(config.x_dns_prefetch_control) === false) {
    throw new Error('new EndpointServer(config), "config.x_dns_prefetch_control" must be "off" or "on"');
  }
  if (typeof config.tls_min_version !== 'string' || accepted_tls_min_version.has(config.tls_min_version) === false) {
    throw new Error('new EndpointServer(config), "config.tls_min_version" must be "TLSv1.3" or "TLSv1.2"');
  }

  const endpoint = this;

  const static_map = new Map();
  const cache_control_map = new Map();
  let is_using_https = false;

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
        'Cache-Control': 'no-store',
      },
      text: null,
      json: null,
      buffer: null,
      stream: null,
      stream_raw_path: null,
      stream_source_path: null,
      stream_etag: null,
      redirect: null,
      error: null,
    };

    if (http_methods.has(endpoint_request.method) === false) {
      endpoint_response.error = new HTTPError(405);
      internals.prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
      return;
    }

    if (is_using_https === true && endpoint_request.encrypted === false) {
      if (endpoint_request.method === 'GET' || endpoint_request.method === 'HEAD') {
        endpoint_response.code = 308;
        endpoint_response.redirect = `https://${endpoint_request.headers.host}${endpoint_request.url.path}`;
        internals.prepare_response(config, endpoint_request, raw_response, endpoint_response);
        return;
      }
    }

    if (is_using_https === false) {
      if (endpoint_request.method === 'POST') {
        endpoint_response.error = new HTTPError(405);
        internals.prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
        return;
      }
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
          endpoint_response.error = new HTTPError(404);
          internals.prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
          return;
        }
        const local_directory = static_map.get(endpoint_directory);

        const file_basename = basename(endpoint_request.url.pathname);
        const file_path = join(local_directory, file_basename);

        try {
          await fs.promises.access(file_path);
        } catch (e) {
          endpoint_response.error = new HTTPError(404, undefined, e.stack);
          internals.prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
          return;
        }

        const file_content_type = mime.contentType(file_basename);
        if (file_content_type === false) {
          endpoint_response.error = new HTTPError(400);
          internals.prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
          return;
        }

        if (cache_control_map.has(endpoint_directory) === true) {
          endpoint_response.headers['Cache-Control'] = cache_control_map.get(endpoint_directory);
        }
        endpoint_response.headers['Content-Type'] = file_content_type;
        endpoint_response.stream_raw_path = file_path;
        internals.prepare_response(config, endpoint_request, raw_response, endpoint_response);
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
          raw_request.on('data', (chunk) => {
            buffer = Buffer.concat([buffer, chunk]);
          });
          raw_request.on('end', () => {
            try {
              endpoint_request.body = JSON.parse(buffer.toString());
              endpoint_request.body_buffer = buffer;
            } catch (e) {
              endpoint_response.error = new HTTPError(400, undefined, e.stack);
              internals.prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
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
            busboy.on('finish', () => {
              handle_request(endpoint_request, raw_response, endpoint_response, handlers, config);
            });
            raw_request.pipe(busboy);
            return;
          }
        }
      }
      handle_request(endpoint_request, raw_response, endpoint_response, handlers, config);
      return;
    }

    endpoint_response.error = new HTTPError(404);
    internals.prepare_response_error(config, endpoint_request, raw_response, endpoint_response);
    return;
  };

  this.http_server = null;
  this.http = (port) => {
    const http_server = http.createServer(request_listener);
    http_server.on('close', () => {
      console.log('http_server CLOSED');
    });
    http_server.on('error', (e) => {
      console.error('http_server ERROR', e.message);
      console.error(e);
    });
    http_server.listen(port, () => {
      console.log('https_server LISTEN', port);
    });
    this.http_server = http_server;
  };

  this.https_server = null;
  this.websocket_server = null;

  this.https = (port, key, cert, ca) => {
    const https_server_options = {
      key,
      cert,
      ca,
      minVersion: config.tls_min_version,
      maxVersion: 'TLSv1.3',
      secureOptions: crypto.constants.SSL_OP_NO_SSLv3
         | crypto.constants.SSL_OP_NO_TLSv1
         | crypto.constants.SSL_OP_NO_TLSv1_1
         | crypto.constants.SSL_OP_NO_TLSv1_2
         | crypto.constants.SSL_OP_NO_TICKET,
    };
    const https_server = https.createServer(https_server_options, request_listener);
    https_server.on('close', () => {
      is_using_https = false;
      console.log('https_server CLOSED');
    });
    https_server.on('error', (e) => {
      console.error('https_server ERROR', e.message);
      console.error(e);
    });
    if (config.use_websocket === true && typeof config.on_websocket_connection === 'function') {
      const websocket_server = new WebSocket.Server({ server: https_server });
      const websocket_client_is_alive = new WeakMap();
      websocket_server.on('connection', (websocket_client, raw_request) => {
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
    https_server.listen(port, () => {
      is_using_https = true;
      console.log('https_server LISTEN', port);
    });
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
