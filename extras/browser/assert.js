
class AssertionError extends Error {
  constructor(message) {
    super(message);
    if (Error.captureStackTrace instanceof Function) {
      Error.captureStackTrace(this, AssertionError);
    }
    this.name = 'AssertionError';
  }
}

/**
 * @param {Boolean} value
 * @param {String|void} message
 */
const assert = (value, message) => {
  if (typeof value !== 'boolean') {
    throw new AssertionError('on assert(value, message), "value" must be a boolean.');
  }
  if (message !== undefined) {
    if (typeof message !== 'string') {
      throw new AssertionError('on assert(value, message), "message" must be a string.');
    }
  }
  if (value === false) {
    throw new AssertionError(`${message || 'assertion failed.'}`);
  }
};

export default assert;
