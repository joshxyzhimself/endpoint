/**
 * @param {Boolean} value
 * @param {String} message
 */
const assert = (value, message) => {
  if (typeof value !== 'boolean') {
    throw new Error('assert(value, message), "value" must be a boolean.');
  }
  if (typeof message !== 'string') {
    throw new Error('assert(value, message), "message" must be a string.');
  }
  if (value !== true) {
    throw new Error(message);
  }
};

module.exports = assert;