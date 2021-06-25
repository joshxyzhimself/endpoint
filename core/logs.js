
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

/**
 * @type {import('./logs').capture_error}
 */
const capture_error = (e) => {
  AssertionError.assert(e instanceof Error, 'ERR_INVALID_ERROR');
  AssertionError.assert(typeof e.name === 'string', 'ERR_INVALID_ERROR');
  AssertionError.assert(typeof e.message === 'string', 'ERR_INVALID_ERROR');
  AssertionError.assert(typeof e.stack === 'string', 'ERR_INVALID_ERROR');

  /**
   * @type {import('./logs').error}
   */
  const error = {
    name: e.name,
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
  AssertionError.assert(entry instanceof Object, 'ERR_INVALID_ENTRY');
  AssertionError.assert(typeof entry.resource_id === 'string', 'ERR_INVALID_ENTRY');
  AssertionError.assert(typeof entry.operation_id === 'string', 'ERR_INVALID_ENTRY');

  AssertionError.assert(entry.severity instanceof Object, 'ERR_INVALID_ENTRY');
  AssertionError.assert(typeof entry.severity.type === 'string', 'ERR_INVALID_ENTRY');
  AssertionError.assert(typeof entry.severity.code === 'number', 'ERR_INVALID_ENTRY');

  AssertionError.assert(entry.trace instanceof Object, 'ERR_INVALID_ENTRY');
  AssertionError.assert(typeof entry.trace.mts === 'number', 'ERR_INVALID_ENTRY');

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