
// @ts-check

/**
 * @type {import('./AssertionError').AssertionError}
 */
class AssertionError extends Error {

  constructor (code, message) {
    if (typeof code !== 'string') {
      throw new TypeError('new AssertionError(code, message?), "code" must be a string.');
    }
    if (typeof message !== 'string') {
      throw new TypeError('new AssertionError(code, message?), "message" must be a string.');
    }
    super(message);
    this.name = 'AssertionError';
    this.code = code;
    if (Error.captureStackTrace instanceof Function) {
      Error.captureStackTrace(this, AssertionError);
    }
  }

  toJSON () {
    /**
     * @type {import('./AssertionError').error_json}
     */
    const error_json = {
      name: this.name,
      code: this.code,
      message: this.message,
      stack: this.stack,
    };
    return error_json;
  }

  static assert (value, code, message) {
    if (typeof value !== 'boolean') {
      throw new TypeError('AssertionError.assert(value, code?, message?), "value" must be a boolean.');
    }
    if (typeof code !== 'string') {
      throw new TypeError('AssertionError.assert(value, code?, message?), "code" must be a string.');
    }
    if (typeof message !== 'string') {
      throw new TypeError('AssertionError.assert(value, code?, message?), "message" must be a string.');
    }
    if (value === false) {
      throw new AssertionError(code, message);
    }
  }
}

module.exports = AssertionError;