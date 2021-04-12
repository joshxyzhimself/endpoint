
/**
 * uwu: uWebSockets utilities
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const zlib = require('zlib');
const crypto = require('crypto');
const assert = require('assert');
const mime_types = require('mime-types');

const zlib_brotli = util.promisify(zlib.brotliCompress);
const zlib_gzip = util.promisify(zlib.gzip);

const cache_control_types = {
  no_store: 'no-store, max-age=0', // For sensitive data
  no_cache: 'no-cache', // For dynamic data
  private_cached: 'private, max-age=3600, s-maxage=3600', // For private static data
  public_cached: 'public, max-age=86400, s-maxage=86400', // For public static data
};

const cached_files = new Map();

const internal_handler_2 = async (res, handler, response, request) => {
  assert(typeof res === 'object');
  assert(typeof handler === 'function');
  assert(typeof response === 'object');
  assert(typeof request === 'object');
  try {
    await handler(response, request);
  } catch (e) {
    console.error(e);
    response.status = 500;
  }
  assert(typeof response.aborted === 'boolean');
  if (response.aborted === true) {
    return;
  }
  assert(typeof response.cache_files === 'boolean');
  assert(typeof response.cache_files_max_age_ms === 'number');
  assert(typeof response.compress === 'boolean');
  assert(typeof response.status === 'number');
  assert(typeof response.headers === 'object');
  if (typeof response.file_path === 'string') {
    assert(path.isAbsolute(response.file_path) === true);
    if (response.cache_files === true) {
      if (cached_files.has(response.file_path) === true) {
        const cached_file = cached_files.get(response.file_path);
        if (Date.now() - cached_file.timestamp > response.cache_files_max_age_ms) {
          cached_files.delete(response.file_path);
        }
      }
      if (cached_files.has(response.file_path) === false) {
        await fs.promises.access(response.file_path);
        const file_name = path.basename(response.file_path);
        const file_content_type = mime_types.contentType(file_name) || undefined;
        const buffer = await fs.promises.readFile(response.file_path);
        const buffer_hash = crypto.createHash('sha256').update(buffer).digest('hex');
        const brotli_buffer = await zlib_brotli(buffer);
        const brotli_buffer_hash = crypto.createHash('sha256').update(brotli_buffer).digest('hex');
        const gzip_buffer = await zlib_gzip(buffer);
        const gzip_buffer_hash = crypto.createHash('sha256').update(gzip_buffer).digest('hex');
        const timestamp = Date.now();
        const cached_file = {
          file_name,
          file_content_type,
          buffer,
          buffer_hash,
          brotli_buffer,
          brotli_buffer_hash,
          gzip_buffer,
          gzip_buffer_hash,
          timestamp,
        };
        cached_files.set(response.file_path, cached_file);
      }
      const cached_file = cached_files.get(response.file_path);
      response.file_name = cached_file.file_name;
      response.file_content_type = cached_file.file_content_type;
      response.buffer = cached_file.buffer;
      response.buffer_hash = cached_file.buffer_hash;
      response.brotli_buffer = cached_file.brotli_buffer;
      response.brotli_buffer_hash = cached_file.brotli_buffer_hash;
      response.gzip_buffer = cached_file.gzip_buffer;
      response.gzip_buffer_hash = cached_file.gzip_buffer_hash;
      response.timestamp = cached_file.timestamp;
    } else {
      await fs.promises.access(response.file_path);
      const file_name = path.basename(response.file_path);
      const file_content_type = mime_types.contentType(file_name) || undefined;
      const buffer = await fs.promises.readFile(response.file_path);
      const buffer_hash = crypto.createHash('sha256').update(buffer).digest('hex');
      response.file_name = file_name;
      response.file_content_type = file_content_type;
      response.buffer = buffer;
      response.buffer_hash = buffer_hash;
    }
    if (typeof response.file_content_type === 'string') {
      response.headers['Content-Type'] = response.file_content_type;
    }
  } else if (typeof response.text === 'string') {
    response.headers['Content-Type'] = 'text/plain';
    response.buffer = Buffer.from(response.text);
  } else if (typeof response.html === 'string') {
    response.headers['Content-Type'] = 'text/html';
    response.buffer = Buffer.from(response.html);
  } else if (typeof response.json === 'object') {
    response.headers['Content-Type'] = 'application/json';
    response.buffer = Buffer.from(JSON.stringify(response.json));
  } else if (response.buffer instanceof Buffer) {
    if (response.headers['Content-Type'] === undefined) {
      response.headers['Content-Type'] = 'application/octet-stream';
    }
  }
  if (response.buffer instanceof Buffer) {
    if (response.compress === true && response.headers['Content-Encoding'] === undefined) {
      if (request.headers.accept_encoding.includes('br') === true) {
        if (response.brotli_buffer === undefined) {
          response.brotli_buffer = await zlib_brotli(response.buffer);
        }
        if (response.brotli_buffer_hash === undefined) {
          response.brotli_buffer_hash = crypto.createHash('sha256').update(response.brotli_buffer).digest('hex');
        }
        response.buffer = response.brotli_buffer;
        response.buffer_hash = response.brotli_buffer_hash;
        response.headers['Content-Encoding'] = 'br';
      } else if (request.headers.accept_encoding.includes('gzip') === true) {
        if (response.gzip_buffer === undefined) {
          response.gzip_buffer = await zlib_gzip(response.buffer);
        }
        if (response.gzip_buffer_hash === undefined) {
          response.gzip_buffer_hash = crypto.createHash('sha256').update(response.gzip_buffer).digest('hex');
        }
        response.buffer = response.gzip_buffer;
        response.buffer_hash = response.gzip_buffer_hash;
        response.headers['Content-Encoding'] = 'gzip';
      }
    }
    if (response.buffer_hash === undefined) {
      response.buffer_hash = crypto.createHash('sha256').update(response.buffer).digest('hex');
    }
    response.headers['ETag'] = response.buffer_hash;
    if (request.headers.if_none_match === response.buffer_hash) {
      response.status = 304;
    }
  }
  if (response.dispose === true && typeof response.file_name === 'string') {
    if (response.headers['Content-Disposition'] === undefined) {
      response.headers['Content-Disposition'] = `attachment; filename="${response.file_name}"`;
    }
  }
  res.writeStatus(String(response.status));
  Object.entries(response.headers).forEach((entry) => {
    const [key, value] = entry;
    assert(typeof key === 'string');
    assert(typeof value === 'string');
    res.writeHeader(key, value);
  });
  if (response.status === 304 || response.buffer === undefined) {
    res.end();
  } else {
    res.end(response.buffer);
  }
  response.end = Date.now();
  response.took = response.end - response.start;
};

/**
  * @param {Function} handler
  * @returns
  */
const serve_handler = (handler) => {
  assert(typeof handler === 'function');

  /**
    *
    * @param {uws.HttpResponse} res
    * @param {uws.HttpRequest} req
    * @returns {void}
    */
  const internal_handler = (res, req) => {
    const request = {
      url: req.getUrl(),
      query: req.getQuery(),
      headers: {
        accept: req.getHeader('accept'),
        accept_encoding: req.getHeader('accept-encoding'),
        content_type: req.getHeader('content-type'),
        if_none_match: req.getHeader('if-none-match'),
        user_agent: req.getHeader('user-agent'),
      },
      json: undefined,
    };
    const response = {
      aborted: false,
      cache_files: false,
      cache_files_max_age_ms: Infinity,
      compress: false,
      dispose: false,
      status: 200,
      headers: {},
      file_path: undefined,
      file_name: undefined,
      file_content_type: undefined,
      text: undefined,
      html: undefined,
      json: undefined,
      buffer: undefined,
      buffer_hash: undefined,
      brotli_buffer: undefined,
      brotli_buffer_hash: undefined,
      gzip_buffer: undefined,
      gzip_buffer_hash: undefined,
      timestamp: undefined,
      start: Date.now(),
      end: undefined,
    };
    let buffer;
    res.onData((chunk, is_last) => {
      if (chunk.byteLength > 0) {
        const chunk_buffer = Buffer.from(chunk);
        buffer = buffer === undefined
          ? chunk_buffer
          : Buffer.concat([buffer, chunk_buffer]);
      }
      if (is_last === true) {
        if (request.headers.content_type.includes('application/json') === true) {
          request.json = JSON.parse(buffer);
        }
        process.nextTick(internal_handler_2, res, handler, response, request);
      }
    });
    res.onAborted(() => {
      response.aborted = true;
    });
  };
  return internal_handler;
};

/**
  * @param {uws.TemplatedApp} app
  * @param {string} route_path
  * @param {string} local_path
  * @returns {void}
  */
const serve_static = (app, route_path, local_path) => {
  assert(app instanceof Object);
  assert(app.get instanceof Function);

  assert(typeof route_path === 'string');
  assert(route_path.substring(0, 1) === '/');
  assert(route_path.substring(route_path.length - 1, route_path.length) === '/');

  assert(typeof local_path === 'string');
  assert(local_path.substring(0, 1) === '/');
  assert(local_path.substring(local_path.length - 1, local_path.length) === '/');

  app.get(`${route_path}*`, serve_handler(async (response, request) => {
    const url_basename = path.basename(request.url);
    const url_extname = path.extname(request.url);
    if (url_basename === '' || url_extname === '') {
      response.status = 404;
      return;
    }
    response.file_path = path.join(process.cwd(), request.url.replace(route_path, local_path));
    response.headers['Cache-Control'] = cache_control_types.no_store;
  }));
};

const uwu = { cache_control_types, serve_handler, serve_static };

module.exports = uwu;