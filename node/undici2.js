
// @ts-check


const crypto = require('crypto');
const assert = require('assert');
const undici = require('undici');
const mime_types = require('mime-types');


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
    const buffer = Buffer.concat(buffer_chunks);
    const response_body = {
      json: null,
      text_plain: null,
      text_tsv: null,
      buffer,
    };
    if (response.headers['content-type'].includes('text/plain') === true) {
      response_body.text_plain = buffer.toString('utf-8');
      resolve(response_body);
      return;
    }
    if (response.headers['content-type'].includes('text/tab-separated-values') === true) {
      response_body.text_tsv = buffer.toString('utf-8');
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
  assert(request_options.multipart === undefined || request_options.multipart instanceof Array);
  assert(request_options.buffer === undefined || typeof request_options.buffer === 'string' || request_options.buffer instanceof Buffer);
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
  } else if (request_options.multipart instanceof Array) {
    assert(request_options.urlencoded === undefined);
    assert(request_options.json === undefined);
    assert(request_options.buffer === undefined);
    const form_boundary = crypto.randomBytes(32).toString('hex');
    const form_items = request_options.multipart;
    const form_item_buffers = [];
    for (let i = 0, l = form_items.length; i < l; i += 1) {
      const form_item = form_items[i];
      assert(form_item instanceof Object);
      assert(typeof form_item.name === 'string');
      assert(typeof form_item.value === 'string' || form_item.value instanceof Buffer || form_item.value instanceof Object);
      assert(form_item.filename === undefined || typeof form_item.filename === 'string');
      let form_item_data = '';
      if (i > 0) {
        form_item_data += '\r\n';
      }
      form_item_data += `--${form_boundary}`;
      form_item_data += `\r\ncontent-disposition: form-data; name="${form_item.name}"`;
      if (typeof form_item.filename === 'string') {
        form_item_data += `; filename="${form_item.filename}"`;
        const mime_type = mime_types.lookup(form_item.filename);
        if (typeof mime_type === 'string') {
          form_item_data += `\r\ncontent-type: ${mime_type}`;
        } else {
          form_item_data += '\r\ncontent-type: application/octet-stream';
        }
      } else if (form_item.value instanceof Object) {
        form_item_data += '\r\ncontent-type: application/json';
      } else if (Buffer.isBuffer(form_item.value) === true) {
        form_item_data += '\r\ncontent-type: application/octet-stream';
      }
      if (form_item.value instanceof Buffer) {
        if (i === form_items.length - 1) {
          const form_item_buffer = Buffer.concat([Buffer.from(`${form_item_data}\r\n\r\n`), form_item.value, Buffer.from(`\r\n--${form_boundary}--`)]);
          form_item_buffers.push(form_item_buffer);
        } else {
          const form_item_buffer = Buffer.concat([Buffer.from(`${form_item_data}\r\n\r\n`), form_item.value]);
          form_item_buffers.push(form_item_buffer);
        }
        continue;
      } else if (form_item.value instanceof Object) {
        if (i === form_items.length - 1) {
          form_item_data += `\r\n\r\n${JSON.stringify(form_item.value)}\r\n--${form_boundary}--`;
        } else {
          form_item_data += `\r\n\r\n${JSON.stringify(form_item.value)}`;
        }
        const form_item_buffer = Buffer.from(form_item_data);
        form_item_buffers.push(form_item_buffer);
        continue;
      } else if (typeof form_item.value === 'string') {
        if (i === form_items.length - 1) {
          form_item_data += `\r\n\r\n${form_item.value}\r\n--${form_boundary}--`;
        } else {
          form_item_data += `\r\n\r\n${form_item.value}`;
        }
        const form_item_buffer = Buffer.from(form_item_data);
        form_item_buffers.push(form_item_buffer);
        continue;
      }
    }
    request_body = Buffer.concat(form_item_buffers);
    request_headers['content-type'] = `multipart/form-data; boundary=${form_boundary}`;
    request_headers['content-length'] = String(request_body.byteLength);
  } else if (typeof request_options.buffer === 'string' || request_options.buffer instanceof Buffer) {
    assert(request_options.urlencoded === undefined);
    assert(request_options.json === undefined);
    assert(request_options.multipart === undefined);
    request_body = request_options.buffer;
    request_headers['content-type'] = 'application/octet-stream';
  }
  const undici_response = await undici.request(request_options.url, {
    method: request_options.method,
    headers: request_headers,
    body: request_body,
  });
  const status = undici_response.statusCode;
  const headers = undici_response.headers;
  const body = await get_response_body(undici_response);
  const response = { status, headers, body };
  return response;
};


module.exports = { request };