
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
     * @type {import('./AssertionError').AssertionErrorJSON}
     */
    const json = {
      name: this.name,
      code: this.code,
      message: this.message,
      stack: this.stack,
    };
    return json;
  }
}

module.exports = AssertionError;