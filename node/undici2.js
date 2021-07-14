
// @ts-check


const crypto = require('crypto');
const assert = require('assert');
const undici = require('undici');
const mime_types = require('mime-types');


const request = undici.request;


const get_response_body_json = (response_body) => new Promise((resolve, reject) => {
  assert(response_body instanceof Object);
  assert(response_body.on instanceof Function);
  const buffer_chunks = [];
  response_body.on('data', (buffer_chunk) => {
    assert(buffer_chunk instanceof Buffer);
    buffer_chunks.push(buffer_chunk);
  });
  response_body.on('end', () => {
    const buffer = Buffer.concat(buffer_chunks);
    const buffer_string = buffer.toString('utf-8');
    try {
      const response_json = JSON.parse(buffer_string);
      resolve(response_json);
    } catch (e) {
      console.error(buffer_string);
      reject(e);
    }
  });
});


/**
 * @type {import('./undici2').json_post}
 */
const json_post = async (request_url, request_headers, request_body) => {
  assert(typeof request_url === 'string');
  assert(request_headers instanceof Object);
  assert(request_body instanceof Object);
  const undici_response = await request(request_url, {
    method: 'POST',
    headers: {
      ...request_headers,
      'content-type': 'application/json',
    },
    body: JSON.stringify(request_body),
  });
  const status = undici_response.statusCode;
  const headers = undici_response.headers;
  const body = await get_response_body_json(undici_response.body);
  const response = { status, headers, body };
  return response;
};


/**
 * @type {import('./undici2').json_get}
 */
const json_get = async (request_url, request_headers) => {
  assert(typeof request_url === 'string');
  assert(request_headers instanceof Object);
  const undici_response = await request(request_url, {
    method: 'GET',
    headers: request_headers,
  });
  const status = undici_response.statusCode;
  const headers = undici_response.headers;
  const body = await get_response_body_json(undici_response.body);
  const response = { status, headers, body };
  return response;
};


/**
 * @type {import('./undici2').form_post}
 */
const form_post = async (request_url, request_headers, form_items) => {
  assert(typeof request_url === 'string');
  assert(request_headers instanceof Object);
  assert(form_items instanceof Array);
  const form_boundary = crypto.randomBytes(32).toString('hex');


  const form_item_buffers = [];
  for (let i = 0, l = form_items.length; i < l; i += 1) {


    /**
     * @type {import('./undici2').form_item}
     */
    const form_item = form_items[i];
    assert(form_item instanceof Object);
    assert(typeof form_item.name === 'string');
    assert(typeof form_item.value === 'string' || form_item.value instanceof Buffer || form_item.value instanceof Object);
    assert(form_item.filename === undefined || typeof form_item.filename === 'string');


    let form_item_data = '';


    // set boundary:
    if (i > 0) {
      form_item_data += '\r\n';
    }
    form_item_data += `--${form_boundary}`;


    // set content disposition:
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
  const request_body = Buffer.concat(form_item_buffers);
  const undici_response = await request(request_url, {
    method: 'POST',
    headers: {
      ...request_headers,
      'content-type': `multipart/form-data; boundary=${form_boundary}`,
      'content-length': String(request_body.byteLength),
    },
    body: request_body,
  });
  const status = undici_response.statusCode;
  const headers = undici_response.headers;
  const body = await get_response_body_json(undici_response.body);
  const response = { status, headers, body };
  return response;
};


module.exports = { json_post, json_get, form_post };