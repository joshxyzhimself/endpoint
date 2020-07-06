

const { hmac } = require('@stablelib/hmac');
const sha256 = require('@stablelib/sha256');
const hex = require('@stablelib/hex');
const utf8 = require('@stablelib/utf8');
const scrypt = require('@stablelib/scrypt');

const qs = require('query-string');

const methods = ['HEAD', 'GET', 'POST', 'PUT', 'DELETE'];

const merge = (...arrays) => {
  const length = arrays.reduce((previous, current) => previous + current.length, 0);
  const merged = new Uint8Array(length);
  for (let i = 0, l = arrays.length, offset = 0; i < l; i += 1) {
    const array = arrays[i];
    merged.set(array, offset);
    offset += array.length;
  }
  return merged;
};

const auth = (username, password) => {
  const username_uint8 = utf8.encode(username.normalize('NFKC'));
  const password_uint8 = utf8.encode(password.normalize('NFKC'));
  const key = sha256.hash(username_uint8);
  const key_hex = hex.encode(key, true);
  const secret = scrypt.deriveKey(password_uint8, sha256.hash(merge(username_uint8, password_uint8)), 16384, 16, 1, 32);
  const secret_hex = hex.encode(secret, true);
  sessionStorage.setItem('key_hex', key_hex);
  sessionStorage.setItem('secret_hex', secret_hex);
};

const deauth = () => {
  sessionStorage.removeItem('key_hex');
  sessionStorage.removeItem('secret_hex');
};

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

  const key_hex = sessionStorage.getItem('key_hex');
  const secret_hex = sessionStorage.getItem('secret_hex');

  if (key_hex === null || secret_hex === null) {
    throw new Error('fetch(options), not authenticated.');
  }

  const secret = hex.decode(secret_hex);

  const timestamp = String(Date.now());

  const url2 = new URL(url);

  const data = [utf8.encode(timestamp), utf8.encode(init.method), utf8.encode(url2.pathname), utf8.encode(url2.search)];

  if (init.headers['Content-Type'] === 'application/json' && typeof init.body === 'string') {
    data.push(utf8.encode(init.body));
  }

  const signature = hmac(sha256.SHA256, secret, merge(...data));
  init.headers['X-KEY'] = key_hex;
  init.headers['X-TIMESTAMP'] = timestamp;
  init.headers['X-SIGNATURE'] = hex.encode(signature, true);

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

const EndpointClient = { auth, deauth, request };

module.exports = EndpointClient;
