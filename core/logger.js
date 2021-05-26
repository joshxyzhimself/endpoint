
// @ts-check

const AssertionError = require('./AssertionError');
const create_emitter = require('./create_emitter');

/**
 * - DEFAULT (0) The log entry has no assigned severity level.
 * - DEBUG (100) Debug or trace information.
 * - INFO (200) Routine information, such as ongoing status or performance.
 * - NOTICE (300) Normal but significant events, such as start up, shut down, or a configuration change.
 * - WARNING (400) Warning events might cause problems.
 * - ERROR (500) Error events are likely to cause problems.
 * - CRITICAL (600) Critical events cause more severe problems or outages.
 * - ALERT (700) A person must take an action immediately.
 * - EMERGENCY (800) One or more systems are unusable.
 * - https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry#logseverity
 */

/**
 * @type {import('./logger').severity_types}
 */
const severity_types = {
  DEFAULT: 'DEFAULT',
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  NOTICE: 'NOTICE',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL',
  ALERT: 'ALERT',
  EMERGENCY: 'EMERGENCY',
};

/**
 * @type {import('./logger').severity_codes}
 */
const severity_codes = new Map([
  ['DEFAULT', 0],
  ['DEBUG', 100],
  ['INFO', 200],
  ['NOTICE', 300],
  ['WARNING', 400],
  ['ERROR', 500],
  ['CRITICAL', 600],
  ['ALERT', 700],
  ['EMERGENCY', 800],
]);

const error_types = {
  ERR_INVALID_PARAMETER_TYPE: 'ERR_INVALID_PARAMETER_TYPE',
};

const emitter = create_emitter();

/**
 * @type {import('./logger').log}
 */
const log = (id, severity_type, message, data) => {
  AssertionError.assert(typeof id === 'string' || typeof id === 'number', error_types.ERR_INVALID_PARAMETER_TYPE);
  AssertionError.assert(typeof severity_type === 'string', error_types.ERR_INVALID_PARAMETER_TYPE);
  AssertionError.assert(typeof message === 'string', error_types.ERR_INVALID_PARAMETER_TYPE);
  AssertionError.assert(severity_codes.has(severity_type) === true, error_types.ERR_INVALID_PARAMETER_TYPE);
  AssertionError.assert(data === undefined || data instanceof Object, error_types.ERR_INVALID_PARAMETER_TYPE);
  if (emitter.index.size > 0) {
    if (emitter.index.has('*') === true) {
      emitter.emit('*', id, severity_type, message, data);
    }
    if (emitter.index.has(severity_type) === true) {
      emitter.emit(severity_type, id, severity_type, message, data);
    }
    if (emitter.index.has(id) === true) {
      emitter.emit(id, id, severity_type, message, data);
    }
  } else {
    const timestamp = Date.now();
    const severity_code = severity_codes.get(severity_type);
    const entry = { id, timestamp, severity_type, severity_code, message, data };
    if (severity_type === severity_types.ERROR) {
      console.error(JSON.stringify(entry, null, 2));
    } else {
      console.log(JSON.stringify(entry, null, 2));
    }
  }
};



const logger = {
  log,
  severity_types,
  severity_codes,
  error_types,
  on: emitter.on,
  off: emitter.off,
};

module.exports = logger;
