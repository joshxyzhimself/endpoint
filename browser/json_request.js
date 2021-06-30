
// @ts-check

const AssertionError = require('../core/AssertionError');

const errors = {
  INVALID_URL: {
    code: 'ERR_REQUEST_INVALID_URL',
    message: 'Invalid url.',
  },
  INVALID_BODY: {
    code: 'ERR_REQUEST_INVALID_BODY',
    message: 'Invalid body.',
  },
  INVALID_STATUS: {
    code: 'ERR_REQUEST_INVALID_STATUS',
    message: 'Invalid status.',
  },
};

/**
 * @typedef json_request_options
 * @type {object}
 * @property {string} method
 * @property {string} url
 * @property {object} body
 */

/**
 * @example
 *
 * const response = await json_request('https://api-pub.bitfinex.com/v2/tickers/hist?symbols=ALL');
 *
 * const response2 = await json_request('https://api-pub.bitfinex.com/v2/tickers/hist?symbols=ALL', {
 *   string: 'test',
 *   number: 123,
 *   boolean: true,
 * });
 *
 * @param {string} url
 * @param {object} body
 * @returns {Promise<any>}
 */
const json_request = async (url, body) => {
  AssertionError.assert(typeof url === 'string', errors.INVALID_URL.code, errors.INVALID_URL.message);
  AssertionError.assert(body === undefined || body instanceof Object, errors.INVALID_BODY.code, errors.INVALID_BODY.message);
  const request_url = url;
  const request_options = { method: 'GET', headers: { 'Accept': 'application/json' } };
  if (body instanceof Object) {
    request_options.method = 'POST';
    request_options.headers['Content-Type'] = 'application/json';
    request_options.body = JSON.stringify(body);
  }
  const response = await fetch(request_url, request_options);
  AssertionError.assert(response.status === 200, errors.INVALID_STATUS.code, errors.INVALID_STATUS.message);
  const response_content_type = response.headers.get('content-type');
  if (typeof response_content_type === 'string' && response_content_type.includes('application/json') === true) {
    const response_json = await response.json();
    return response_json;
  }
  throw new Error(`Unexpected response content type, got "${response_content_type}".`);
};

module.exports = json_request;