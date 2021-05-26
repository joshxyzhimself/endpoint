
// @ts-check

const fs = require('fs');
const path = require('path');
const AssertionError = require('../core/AssertionError');
const logger = require('../core/logger');

const severity_codes = logger.severity_codes;
const error_types = logger.error_types;

fs.mkdirSync(path.join(process.cwd(), 'temp'), { recursive: true });

/**
 * @type {import('./logger_to_file').listener}
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
  const local = new Date(timestamp);
  const file_name = `${local.getUTCMonth()}-${local.getUTCDate()}-${local.getUTCFullYear()}.log`;
  const file_path = path.join(process.cwd(), 'temp', file_name);
  fs.appendFileSync(file_path, `\n${JSON.stringify(entry)}`);
};

/**
 * @type {import('./logger_to_file').enable}
 */
const enable = (id) => {
  AssertionError.assert(typeof id === 'string' || typeof id === 'number', error_types.ERR_INVALID_PARAMETER_TYPE);
  logger.on(id, listener);
};

/**
 * @type {import('./logger_to_file').disable}
 */
const disable = (id) => {
  AssertionError.assert(typeof id === 'string' || typeof id === 'number', error_types.ERR_INVALID_PARAMETER_TYPE);
  logger.off(id, listener);
};

const logger_to_file = { enable, disable };

module.exports = logger_to_file;