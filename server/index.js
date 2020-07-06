
const fs = require('fs');
const url = require('url');
const zlib = require('zlib');
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const { extname, dirname, basename, join } = require('path');

const mime = require('mime-types');

const Busboy = require('busboy');


const methods = ['HEAD', 'GET', 'POST', 'PUT', 'DELETE'];

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
        response2.status = 304;
        delete response2.body;
      }
    }
  }

  response.writeHead(response2.status, response2.headers).end(response2.body);
};

const prepare = (request2, response, response2) => {

  if (Buffer.isBuffer(response2.body) === false) {
    if (typeof response2.body === 'object') { // application/json; charset=utf-8
      response2.body = JSON.stringify(response2.body);
    }
    if (typeof response2.body === 'string') { // 'text/html; charset=utf-8'
      response2.body = Buffer.from(response2.body);
    }
  }

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

  complete(request2, response, response2);
};

const error = (request2, response, response2, statusCode, errorCode, errorMessage) => {
  response2.status = statusCode;
  response2.body = { error: { status: statusCode, code: errorCode, message: errorMessage, timestamp: new Date().toISOString() } };
  return prepare(request2, response, response2);
};

const handle = async (request2, response, response2, handlers) => {
  try {
    let response3;
    for (let i = 0, l = handlers.length; i < l; i += 1) {
      const handler = handlers[i];
      response3 = await handler(request2, response2);
      if (response3 === response2) {
        break;
      }
      if (response3 !== undefined) {
        console.error({ response3 });
        throw new Error('Invalid handler return type, expecting "response" object or "undefined".');
      }
    }
    if (response3 === undefined) {
      throw new Error('Invalid handler return type, at least one handler must return the "response" object.');
    }
    return prepare(request2, response, response2);
  } catch (e) {
    return error(request2, response, response2, 500, 500, `INTERNAL SERVER ERROR. ${e.message}`);
  }
};

function EndpointServer() {

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

  const requestListener = async (request, response) => {

    const request2 = {
      is_encrypted: request.socket.encrypted === true,
      method: request.method,
      headers: request.headers,
      url: url.parse(request.url, true),
    };
    const response2 = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {},
    };

    if (methods.includes(request2.method) === false) {
      return error(request2, response, response2, 405, 405, 'METHOD NOT ALLOWED');
    }

    if (request2.method === 'HEAD' || request2.method === 'GET') {
      const ext = extname(request2.url.pathname);
      if (ext !== '') {
        const dir = dirname(request2.url.pathname);
        if (static_map.has(dir) === false) {
          return error(request2, response, response2, 404, 404, 'NOT FOUND');
        }
        const dir2 = static_map.get(dir);

        const file_basename = basename(request2.url.pathname);
        const file_path = join(dir2, file_basename);

        try {
          await fs.promises.access(file_path);
        } catch (e) {
          return error(request2, response, response2, 404, 404, 'NOT FOUND');
        }

        const file_content_type = mime.contentType(file_basename);
        if (file_content_type === false) {
          return error(request2, response, response2, 400, 400, 'BAD REQUEST');
        }

        const file_content_buffer = await fs.promises.readFile(file_path);
        if (cache_control_map.has(dir) === true) {
          response2.headers['Cache-Control'] = cache_control_map.get(dir);
        }
        response2.headers['Content-Type'] = file_content_type;
        response2.body = file_content_buffer;
        return prepare(request2, response, response2);
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
              return error(request2, response, response2, 400, 400, `BAD REQUEST. ${e.message}`);
            }
            return handle(request2, response, response2, handlers);
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
              return handle(request2, response, response2, handlers);
            });
            return request.pipe(busboy);
          }
        }
      }

      return handle(request2, response, response2, handlers);
    }

    return error(request2, response, response2, 404, 404, 'NOT FOUND');
  };

  this.http = (port, callback) => {
    const server = http.createServer(requestListener);
    server.on('close', () => console.error('Server closed'));
    server.on('error', (e) => console.error('Server error', e.message));
    server.listen(port, callback);
  };

  this.https = (port, key, cert, ca, callback) => {
    const server = https.createServer({ key, cert, ca }, requestListener);
    server.on('close', () => console.error('Server closed'));
    server.on('error', (e) => console.error('Server error', e.message));
    server.listen(port, callback);
  };
}

module.exports = EndpointServer;
