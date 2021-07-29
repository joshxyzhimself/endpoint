
// @ts-check

const undici = require('undici');
const multipart = require('multi-part');
const assert = require('../core/assert');


/**
 *
 * @type {import('./undici2').get_response_body}
 */
const get_response_body = (response) => new Promise((resolve, reject) => {
  assert(response.body instanceof Object);
  assert(response.body.on instanceof Function);
  const buffer_chunks = [];
  response.body.on('data', (buffer_chunk) => {
    assert(buffer_chunk instanceof Buffer);
    buffer_chunks.push(buffer_chunk);
  });
  response.body.on('end', () => {
    const buffer = buffer_chunks.length > 0
      ? Buffer.concat(buffer_chunks)
      : null;
    const response_body = {
      json: null,
      string: null,
      buffer,
    };
    if (buffer instanceof Buffer) {
      if (typeof response.headers['content-type'] === 'string') {
        if (response.headers['content-type'].includes('text/plain') === true) {
          response_body.string = buffer.toString('utf-8');
          resolve(response_body);
          return;
        }
        if (response.headers['content-type'].includes('text/tab-separated-values') === true) {
          response_body.string = buffer.toString('utf-8');
          resolve(response_body);
          return;
        }
        if (response.headers['content-type'].includes('application/json') === true) {
          const buffer_string = buffer.toString('utf-8');
          try {
            response_body.json = JSON.parse(buffer_string);
            resolve(response_body);
            return;
          } catch (e) {
            reject(e);
            return;
          }
        }
      }
    }
    resolve(response_body);
  });
});


/**
 * @type {import('./undici2').request}
 */
const request = async (request_options) => {
  assert(request_options instanceof Object);
  assert(typeof request_options.method === 'string');
  assert(typeof request_options.url === 'string');
  assert(request_options.headers === undefined || request_options.headers instanceof Object);
  assert(request_options.urlencoded === undefined || request_options.urlencoded instanceof Object);
  assert(request_options.json === undefined || request_options.json instanceof Object);
  assert(request_options.multipart === undefined || request_options.multipart instanceof Object);
  assert(request_options.buffer === undefined || typeof request_options.buffer === 'string' || request_options.buffer instanceof Buffer);
  assert(request_options.signal === undefined || request_options.signal instanceof AbortSignal);
  const request_headers = { ...request_options.headers };
  let request_body;
  if (request_options.method === 'GET' || request_options.method === 'HEAD') {
    assert(request_options.urlencoded === undefined);
    assert(request_options.json === undefined);
    assert(request_options.multipart === undefined);
  } else if (request_options.urlencoded instanceof Object) {
    assert(request_options.json === undefined);
    assert(request_options.multipart === undefined);
    assert(request_options.buffer === undefined);
    request_body = new URLSearchParams(request_options.urlencoded).toString();
    request_headers['content-type'] = 'application/x-www-form-urlencoded';
  } else if (request_options.json instanceof Object) {
    assert(request_options.urlencoded === undefined);
    assert(request_options.multipart === undefined);
    assert(request_options.buffer === undefined);
    request_body = JSON.stringify(request_options.json);
    request_headers['content-type'] = 'application/json';
  } else if (request_options.multipart instanceof Object) {
    assert(request_options.urlencoded === undefined);
    assert(request_options.json === undefined);
    assert(request_options.buffer === undefined);
    const form = new multipart();
    Object.entries(request_options.multipart).forEach((entry) => {
      const [key, value] = entry;
      form.append(key, value);
    });
    const form_buffer = await form.buffer();
    const form_headers = form.getHeaders(false);
    request_body = form_buffer;
    Object.assign(request_headers, form_headers);
  } else if (typeof request_options.buffer === 'string' || request_options.buffer instanceof Buffer) {
    assert(request_options.urlencoded === undefined);
    assert(request_options.json === undefined);
    assert(request_options.multipart === undefined);
    request_body = request_options.buffer;
    request_headers['content-type'] = 'application/octet-stream';
  }
  const request_signal = request_options.signal;
  const undici_response = await undici.request(request_options.url, {
    method: request_options.method,
    headers: request_headers,
    body: request_body,
    signal: request_signal,
  });
  const status = undici_response.statusCode;
  const headers = undici_response.headers;
  const body = await get_response_body(undici_response);
  const response = { status, headers, body };
  return response;
};


module.exports = { request };