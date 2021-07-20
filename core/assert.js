
// @ts-check

const AssertionError = require('./AssertionError');

/**
 * @type {import('./assert').assert}
 */
const assert = (value, code, message) => {
  if (typeof value !== 'boolean') {
    throw new TypeError('assert(value, code?, message?), "value" must be a boolean.');
  }
  if (code !== undefined && typeof code !== 'string') {
    throw new TypeError('assert(value, code?, message?), "code" must be a string.');
  }
  if (message !== undefined && typeof message !== 'string') {
    throw new TypeError('assert(value, code?, message?), "message" must be a string.');
  }
  if (value === false) {
    throw new AssertionError(code || 'ERR_ASSERTION_ERROR', message || 'Assertion error.');
  }
};

module.exports = assert;