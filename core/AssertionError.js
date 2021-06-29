
// @ts-check

/**
 * @type {import('./AssertionError')}
 */
class AssertionError extends Error {

  constructor (message) {
    super(message);
    this.name = 'AssertionError';
    if (Error.captureStackTrace instanceof Function) {
      Error.captureStackTrace(this, AssertionError);
    }
  }

  toJSON () {
    return { name: this.name, message: this.message, stack: this.stack };
  }

  static assert (value, message) {
    if (typeof value !== 'boolean') {
      throw new TypeError('assert(value, message?), "value" must be a boolean.');
    }
    if (message !== undefined && typeof message !== 'string') {
      throw new TypeError('assert(value, message?), "message" must be a string.');
    }
    if (value === false) {
      throw new AssertionError(message || 'assert(value, message?), assertion error.');
    }
  }
}

module.exports = AssertionError;