
class AssertionError extends Error {
  constructor(message) {
    super(message);
    if (Error.captureStackTrace instanceof Function) {
      Error.captureStackTrace(this, AssertionError);
    }
  }
}

/**
 * @param {Boolean} value
 * @param {String|undefined} message
 */
const assert = (value, message) => {
  if (typeof value !== 'boolean') {
    throw new AssertionError('assert(value, message?), "value" must be a boolean.');
  }
  if (message !== undefined && typeof message !== 'string') {
    throw new AssertionError('assert(value, message?), "message" must be a string.');
  }
  if (value === false) {
    throw new AssertionError(`assert(value, message?), ${message || 'assertion failed.'}`);
  }
};

export default assert;
