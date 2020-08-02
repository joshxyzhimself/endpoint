
const qs = require('query-string');

const methods = ['HEAD', 'GET', 'POST', 'PUT', 'DELETE'];

const controller_map = new Map();

const request = async (options) => {
  const url = qs.stringifyUrl({ url: options.url, query: options.query });

  if (methods.includes(options.method) === false) {
    throw new Error('request(options), Invalid method.');
  }

  const init = {
    method: options.method,
    headers: {},
  };

  if (options.id !== undefined) {
    if (typeof options.id !== 'string' || options.id === '') {
      throw new Error('request(options), "options.id" must be a non-empty string.');
    }
    if (controller_map.has(options.id) === true) {
      const existing_controller = controller_map.get(options.id);
      existing_controller.abort();
      controller_map.delete(options.id);
    }
    const new_controller = new AbortController();
    init.signal = new_controller.signal;
    controller_map.set(options.id, new_controller);
  }

  if (Array.isArray(options.files) === true) {
    const form = new FormData();
    options.files.forEach((file) => form.append('files', file));
    if (typeof options.json === 'object') {
      form.append('body', JSON.stringify(options.json), 'body.json');
    }
    init.headers['Content-Type'] = 'multipart/form-data';
  } else if (typeof options.json === 'object') {
    init.body = JSON.stringify(options.json);
    init.headers['Content-Type'] = 'application/json';
  } else if (typeof options.urlencoded === 'object') {
    init.body = JSON.stringify(options.urlencoded);
    init.headers['Content-Type'] = 'application/x-www-form-urlencoded';
  }

  try {
    const response = await fetch(url, init);

    const response_content_type = response.headers.get('content-type');

    if (typeof response_content_type !== 'string') {
      throw new Error('request(options), response_content_type must be a string.');
    }

    switch (response_content_type) {
      case 'application/json': {
        try {
          const response_json = await response.json();
          if (options.id !== undefined) {
            controller_map.delete(options.id);
          }
          return response_json;
        } catch (e) {
          if (options.id !== undefined) {
            controller_map.delete(options.id);
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
          const response_blob_object_url = window.URL.createObjectURL(response_blob);
          const link_element = document.createElement('a');
          link_element.href = response_blob_object_url;
          link_element.download = response_blob_filename;
          link_element.click();
          setTimeout(() => window.URL.revokeObjectURL(response_blob_object_url), 250);
          if (options.id !== undefined) {
            controller_map.delete(options.id);
          }
          return {};
        } catch (e) {
          if (options.id !== undefined) {
            controller_map.delete(options.id);
          }
          console.error(e);
          throw new Error(`request(options), application/octet-stream parsing error. ${e.message}`);
        }
      }
      default: {
        if (options.id !== undefined) {
          controller_map.delete(options.id);
        }
        throw new Error(`request(options), Unexpected response_content_type, got "${response_content_type}"`);
      }
    }
  } catch (e) {
    if (e.name === 'AbortError') {
      throw e;
    }
    console.error(e);
    throw new Error(`request(options), Network error. ${e.message}`);
  }

};

const EndpointClient = { request, controller_map };

module.exports = EndpointClient;
