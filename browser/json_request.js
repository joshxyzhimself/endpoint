const AssertionError = require('../core/AssertionError');

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
 * @returns {object}
 */
const json_request = async (url, body) => {
  AssertionError.assert(typeof url === 'string');
  AssertionError.assert(body === undefined || body instanceof Object);
  const request_url = url;
  const request_options = { method: 'GET', headers: { 'Accept': 'application/json' } };
  if (body instanceof Object) {
    request_options.method = 'POST';
    request_options.headers['Content-Type'] = 'application/json';
    request_options.body = JSON.stringify(body);
  }
  const response = await fetch(request_url, request_options);
  AssertionError.assert(response.status === 200);
  const response_content_type = response.headers.get('content-type');
  if (typeof response_content_type === 'string' && response_content_type.includes('application/json') === true) {
    const response_json = await response.json();
    return response_json;
  }
  throw new Error(`Unexpected response content type, got "${response_content_type}".`);
};

module.exports = json_request;