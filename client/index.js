
const qs = require('query-string');

const methods = ['HEAD', 'GET', 'POST', 'PUT', 'DELETE'];

const request = async (options) => {
  const url = qs.stringifyUrl({ url: options.url, query: options.query });

  if (methods.includes(options.method) === false) {
    throw new Error('fetch(options), Invalid method.');
  }

  const init = {
    method: options.method,
    headers: {},
  };

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
      throw new Error('fetch(options), response_content_type must be a string.');
    }

    switch (response_content_type) {
      case 'application/json': {
        try {
          const response_json = await response.json();
          return response_json;
        } catch (e) {
          console.error(e);
          throw new Error(`fetch(options), application/json parsing error. ${e.message}`);
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
          return {};
        } catch (e) {
          console.error(e);
          throw new Error(`fetch(options), application/octet-stream parsing error. ${e.message}`);
        }
      }
      default: {
        throw new Error(`fetch(options), Unexpected response_content_type, got "${response_content_type}"`);
      }
    }
  } catch (e) {
    console.error(e);
    throw new Error(`fetch(options), Network error. ${e.message}`);
  }

};

const EndpointClient = { request };

module.exports = EndpointClient;
