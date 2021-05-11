
const AssertionError = require('./AssertionError');
const create_emitter = require('./create_emitter');

const error_types = {
  ERR_INVALID_PARAMETER_TYPE: 'ERR_INVALID_PARAMETER_TYPE',
};

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

const severity_codes = {
  DEFAULT: 0,
  DEBUG: 100,
  INFO: 200,
  NOTICE: 300,
  WARNING: 400,
  ERROR: 500,
  CRITICAL: 600,
  ALERT: 700,
  EMERGENCY: 800,
};

const severity_type_values = new Set(Object.values(severity_types));

const emitter = create_emitter();

/**
 * @param {string|number} id - required
 * @param {string} severity_type - required
 * @param {string} message - required
 * @param {object} data - optional
 */
const log = (id, severity_type, message, data) => {
  AssertionError.assert(typeof id === 'string' || typeof id === 'number', error_types.ERR_INVALID_PARAMETER_TYPE);
  AssertionError.assert(typeof severity_type === 'string', error_types.ERR_INVALID_PARAMETER_TYPE);
  AssertionError.assert(typeof message === 'string', error_types.ERR_INVALID_PARAMETER_TYPE);
  AssertionError.assert(severity_type_values.has(severity_type) === true, error_types.ERR_INVALID_PARAMETER_TYPE);
  AssertionError.assert(data === undefined || data instanceof Object, error_types.ERR_INVALID_PARAMETER_TYPE);
  emitter.emit(id, severity_type, message, data);
  emitter.emit('*', id, severity_type, message, data);
};

/**
 * @type {Map<string, Function>}
 */
const listeners = new Map();

const catch_all_listener = (id, severity_type, message, data) => {
  AssertionError.assert(typeof id === 'string' || typeof id === 'number', error_types.ERR_INVALID_PARAMETER_TYPE);
  AssertionError.assert(typeof severity_type === 'string', error_types.ERR_INVALID_PARAMETER_TYPE);
  AssertionError.assert(typeof message === 'string', error_types.ERR_INVALID_PARAMETER_TYPE);
  AssertionError.assert(data === undefined || data instanceof Object, error_types.ERR_INVALID_PARAMETER_TYPE);
  const severity_code = severity_codes[severity_type];
  console.log(`${id}: ${severity_type} (${severity_code}): ${message}`);
  if (data instanceof Object) {
    console.log(JSON.stringify(data, null, 2));
  }
};

/**
 * @param {string} id
 */
const enable_console_logs = (id) => {
  AssertionError.assert(typeof id === 'string' || typeof id === 'number', error_types.ERR_INVALID_PARAMETER_TYPE);
  if (id === '*') {
    emitter.on(id, catch_all_listener);
    listeners.set(id, catch_all_listener);
    return;
  }
  const listener = (severity_type, message, data) => {
    AssertionError.assert(typeof severity_type === 'string', error_types.ERR_INVALID_PARAMETER_TYPE);
    AssertionError.assert(typeof message === 'string', error_types.ERR_INVALID_PARAMETER_TYPE);
    AssertionError.assert(data === undefined || data instanceof Object, error_types.ERR_INVALID_PARAMETER_TYPE);
    const severity_code = severity_codes[severity_type];
    console.log(`${id}: ${severity_type} (${severity_code}): ${message}`);
    if (data instanceof Object) {
      console.log(JSON.stringify(data, null, 2));
    }
  };
  emitter.on(id, listener);
  listeners.set(id, listener);
};

/**
 * @param {string} id
 */
const disable_console_logs = (id) => {
  AssertionError.assert(typeof id === 'string' || typeof id === 'number', error_types.ERR_INVALID_PARAMETER_TYPE);
  AssertionError.assert(listeners.has(id) === true, error_types.ERR_INVALID_PARAMETER_TYPE);
  const listener = listeners.get(id);
  emitter.off(id, listener);
  listeners.delete(id);
};

const logger = {
  log,
  enable_console_logs,
  disable_console_logs,
  severity_types,
  error_types,
  on: emitter.on,
  off: emitter.off,
};

module.exports = logger;
