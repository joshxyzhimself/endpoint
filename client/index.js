
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

    const responseContentType = response.headers.get('content-type');

    if (typeof responseContentType !== 'string') {
      throw new Error('fetch(options), Response content-type must be a string.');
    }
    if (responseContentType.includes('application/json') === false) {
      throw new Error('fetch(options), Response content-type must be a application/json.');
    }

    try {
      const response2 = await response.json();
      return response2;
    } catch (e) {
      console.error(e);
      throw new Error(`fetch(options), Parsing error. ${e.message}`);
    }
  } catch (e) {
    console.error(e);
    throw new Error(`fetch(options), Network error. ${e.message}`);
  }

};

const EndpointClient = { request };

module.exports = EndpointClient;
