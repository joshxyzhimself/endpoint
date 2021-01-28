
class AssertionError extends Error {

  /**
   * @param {String|void} message
   */
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

  /**
   * @param {Boolean} value
   * @param {String|void} message
   */
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