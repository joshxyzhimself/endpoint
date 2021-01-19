
// updated: 01-13-2021

class AssertionError extends Error {

  /**
   * @param {String} message
   * @param {String} code
   */
  constructor (message, code) {
    super(message);
    this.name = 'AssertionError';
    this.code = code;
    if (Error.captureStackTrace instanceof Function) {
      Error.captureStackTrace(this, AssertionError);
    }
  }

  toJSON () {
    return { name: this.name, message: this.message, code: this.code, stack: this.stack };
  }
}

/**
 * @param {Boolean} value
 * @param {String} message
 * @param {String} code
 */
const assert = (value, message, code) => {
  if (typeof value !== 'boolean') {
    throw new Error('assert(value, message?, code?), "value" must be a boolean.');
  }
  if (message !== undefined && typeof message !== 'string') {
    throw new Error('assert(value, message?, code?), "message" must be a string.');
  }
  if (code !== undefined && typeof code !== 'string' && typeof code !== 'number') {
    throw new Error('assert(value, message?, code?), "code" must be a string or number.');
  }
  if (value === false) {
    throw new AssertionError(message, code);
  }
};

module.exports = assert;