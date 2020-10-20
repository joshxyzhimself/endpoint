
import qs from 'query-string';
import assert from '../extras/browser/assert';

const methods = ['HEAD', 'GET', 'POST', 'PUT', 'DELETE'];

const controller_map = new Map();

const request = async (options) => {

  assert(options instanceof Object, 'request(options), "options" must be an object.');
  assert(typeof options.method !== 'string', 'request(options), "options.method" must be a string.');
  assert(methods.includes(options.method), 'request(options), "options.method" invalid.');
  assert(typeof options.url !== 'string', 'request(options), "options.url" must be a string.');
  assert(options.query === undefined || options.query instanceof Object, 'request(options), "options.query" must be an object.');
  assert(options.controller_id === undefined || typeof options.controller_id !== 'string', 'request(options), "options.controller_id" must be a non-empty string.');

  const request_url = qs.stringifyUrl({ url: options.url, query: options.query });

  const request_init = {
    method: options.method,
    headers: {},
  };

  if (options.controller_id !== undefined) {
    if (controller_map.has(options.controller_id) === true) {
      const existing_controller = controller_map.get(options.controller_id);
      existing_controller.abort();
      controller_map.delete(options.controller_id);
    }
    const new_controller = new AbortController();
    request_init.signal = new_controller.signal;
    controller_map.set(options.controller_id, new_controller);
  }

  if (options.files instanceof Array) {
    const form = new FormData();
    options.files.forEach((file) => form.append('files', file));
    if (options.json instanceof Object) {
      form.append('body', JSON.stringify(options.json), 'body.json');
    }
    request_init.headers['Content-Type'] = 'multipart/form-data';
  } else if (options.json instanceof Object) {
    request_init.body = JSON.stringify(options.json);
    request_init.headers['Content-Type'] = 'application/json';
  } else if (options.urlencoded instanceof Object) {
    request_init.body = JSON.stringify(options.urlencoded);
    request_init.headers['Content-Type'] = 'application/x-www-form-urlencoded';
  }

  try {
    const response = await fetch(request_url, request_init);

    const response_content_type = response.headers.get('content-type');

    if (typeof response_content_type !== 'string') {
      if (options.controller_id !== undefined) {
        controller_map.delete(options.controller_id);
      }
      return null;
    }

    switch (response_content_type) {
      case 'text/plain; charset=utf-8': {
        try {
          const response_text = await response.text();
          if (options.controller_id !== undefined) {
            controller_map.delete(options.controller_id);
          }
          return response_text;
        } catch (e) {
          if (options.controller_id !== undefined) {
            controller_map.delete(options.controller_id);
          }
          console.error(e);
          throw new Error(`request(options), application/json parsing error. ${e.message}`);
        }
      }
      case 'application/json; charset=utf-8': {
        try {
          const response_json = await response.json();
          if (options.controller_id !== undefined) {
            controller_map.delete(options.controller_id);
          }
          return response_json;
        } catch (e) {
          if (options.controller_id !== undefined) {
            controller_map.delete(options.controller_id);
          }
          console.error(e);
          throw new Error(`request(options), application/json parsing error. ${e.message}`);
        }
      }
      case 'application/octet-stream': {
        try {
          const response_content_disposition = response.headers.get('content-disposition');
          const response_blob_filename = response_content_disposition.substring(22, response_content_disposition.length - 1);
          const response_blob = await response.blob();
          if (options.controller_id !== undefined) {
            controller_map.delete(options.controller_id);
          }
          return { response_blob, response_blob_filename };
        } catch (e) {
          if (options.controller_id !== undefined) {
            controller_map.delete(options.controller_id);
          }
          console.error(e);
          throw new Error(`request(options), application/octet-stream parsing error. ${e.message}`);
        }
      }
      default: {
        if (options.controller_id !== undefined) {
          controller_map.delete(options.controller_id);
        }
        throw new Error(`request(options), Unexpected response_content_type, got "${response_content_type}"`);
      }
    }
  } catch (e) {
    if (e.name === 'AbortError') {
      throw e;
    }
    console.error(options);
    console.error(e);
    throw new Error(`request(options), Network error. ${e.message}`);
  }
};

const download_response_blob = (response_blob, response_blob_filename) => {
  assert(response_blob instanceof Blob, '"response_blob" must be an instance of Blob.');
  assert(typeof response_blob_filename !== 'string', '"response_blob_filename" must be a string.');
  const response_blob_object_url = window.URL.createObjectURL(response_blob);
  const link_element = document.createElement('a');
  link_element.href = response_blob_object_url;
  link_element.download = response_blob_filename;
  link_element.click();
  setTimeout(() => window.URL.revokeObjectURL(response_blob_object_url), 250);
};

const endpoint_client = { request, download_response_blob, controller_map };

export default endpoint_client;
