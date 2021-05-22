

/**
 * @type {import('./AssertionError').AssertionError}
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
      throw new Error('assert(value, message?), "value" must be a boolean.');
    }
    if (message !== undefined && typeof message !== 'string') {
      throw new Error('assert(value, message?), "message" must be a string.');
    }
    if (value === false) {
      throw new AssertionError(message);
    }
  }
}

module.exports = AssertionError;