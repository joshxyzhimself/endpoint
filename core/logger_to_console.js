
// @ts-check

const AssertionError = require('./AssertionError');
const logger = require('./logger');

const severity_types = logger.severity_types;
const severity_codes = logger.severity_codes;
const error_types = logger.error_types;

/**
 * @type {import('./logger_to_console').listener}
 */
const listener = (id, severity_type, message, data) => {
  AssertionError.assert(typeof id === 'string' || typeof id === 'number', error_types.ERR_INVALID_PARAMETER_TYPE);
  AssertionError.assert(typeof severity_type === 'string', error_types.ERR_INVALID_PARAMETER_TYPE);
  AssertionError.assert(typeof message === 'string', error_types.ERR_INVALID_PARAMETER_TYPE);
  AssertionError.assert(severity_codes.has(severity_type) === true, error_types.ERR_INVALID_PARAMETER_TYPE);
  AssertionError.assert(data === undefined || data instanceof Object, error_types.ERR_INVALID_PARAMETER_TYPE);
  const timestamp = Date.now();
  const severity_code = severity_codes.get(severity_type);
  const entry = { id, timestamp, severity_type, severity_code, message, data };
  if (severity_type === severity_types.ERROR) {
    console.error(JSON.stringify(entry, null, 2));
  } else {
    console.log(JSON.stringify(entry, null, 2));
  }
};

/**
 * @type {import('./logger_to_console').enable}
 */
const enable = (id) => {
  AssertionError.assert(typeof id === 'string' || typeof id === 'number', error_types.ERR_INVALID_PARAMETER_TYPE);
  logger.on(id, listener);
};

/**
 * @type {import('./logger_to_console').disable}
 */
const disable = (id) => {
  AssertionError.assert(typeof id === 'string' || typeof id === 'number', error_types.ERR_INVALID_PARAMETER_TYPE);
  logger.off(id, listener);
};

const logger_to_console = { enable, disable };

module.exports = logger_to_console;