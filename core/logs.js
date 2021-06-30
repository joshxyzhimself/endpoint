
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
 * @type {import('./logs').severity_types}
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
 * @type {import('./logs').severity_codes}
 */
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

const emitter = create_emitter();

const errors = {
  INVALID_ERROR: {
    code: 'ERR_LOGS_INVALID_ERROR',
    message: 'Invalid error.',
  },
  INVALID_ENTRY: {
    code: 'ERR_LOGS_INVALID_ENTRY',
    message: 'Invalid entry.',
  },
};

/**
 * @type {import('./logs').capture_error}
 */
const capture_error = (e) => {
  AssertionError.assert(e instanceof Error, errors.INVALID_ERROR.code, errors.INVALID_ERROR.message);
  AssertionError.assert(typeof e.name === 'string', errors.INVALID_ERROR.code, errors.INVALID_ERROR.message);
  AssertionError.assert(e.code === undefined || typeof e.code === 'string', errors.INVALID_ERROR.code, errors.INVALID_ERROR.message);
  AssertionError.assert(typeof e.message === 'string', errors.INVALID_ERROR.code, errors.INVALID_ERROR.message);
  AssertionError.assert(typeof e.stack === 'string', errors.INVALID_ERROR.code, errors.INVALID_ERROR.message);

  /**
   * @type {import('./logs').error}
   */
  const error = {
    name: e.name,
    code: e.code,
    message: e.message,
    stack: e.stack,

    // @ts-ignore
    got_response_status_code: e?.response?.statusCode,

    // @ts-ignore
    got_response_status_message: e?.response?.statusMessage,

    // @ts-ignore
    got_response_body: e?.response?.body,
  };


  return error;
};

/**
 * @param {import('./logs').entry} entry
 */
const emit = (entry) => {
  AssertionError.assert(entry instanceof Object, errors.INVALID_ENTRY.code, errors.INVALID_ENTRY.message);
  AssertionError.assert(typeof entry.resource_id === 'string', errors.INVALID_ENTRY.code, errors.INVALID_ENTRY.message);
  AssertionError.assert(typeof entry.operation_id === 'string', errors.INVALID_ENTRY.code, errors.INVALID_ENTRY.message);

  AssertionError.assert(entry.severity instanceof Object, errors.INVALID_ENTRY.code, errors.INVALID_ENTRY.message);
  AssertionError.assert(typeof entry.severity.type === 'string', errors.INVALID_ENTRY.code, errors.INVALID_ENTRY.message);
  AssertionError.assert(typeof entry.severity.code === 'number', errors.INVALID_ENTRY.code, errors.INVALID_ENTRY.message);

  AssertionError.assert(entry.trace instanceof Object, errors.INVALID_ENTRY.code, errors.INVALID_ENTRY.message);
  AssertionError.assert(typeof entry.trace.mts === 'number', errors.INVALID_ENTRY.code, errors.INVALID_ENTRY.message);

  emitter.emit('*', entry);
  emitter.emit(entry.resource_id, entry);
};

module.exports = {
  severity_types,
  severity_codes,
  capture_error,
  on: emitter.on,
  off: emitter.off,
  emit,
};