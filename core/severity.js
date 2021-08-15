
// @ts-check


// DEFAULT (0) The log entry has no assigned severity level.
// DEBUG (100) Debug or trace information.
// INFO (200) Routine information, such as ongoing status or performance.
// NOTICE (300) Normal but significant events, such as start up, shut down, or a configuration change.
// WARNING (400) Warning events might cause problems.
// ERROR (500) Error events are likely to cause problems.
// CRITICAL (600) Critical events cause more severe problems or outages.
// ALERT (700) A person must take an action immediately.
// EMERGENCY (800) One or more systems are unusable.
// https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry#logseverity


const assert = require('./assert');


/**
 * @type {import('./severity').types}
 */
const types = {
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
 * @type {import('./severity').codes}
 */
const codes = {
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


/**
 * @type {import('./severity').extract_error}
 */
const extract_error = (e) => {
  assert(e instanceof Error);
  assert(typeof e.name === 'string');
  assert(e.code === undefined || typeof e.code === 'string');
  assert(typeof e.message === 'string');
  assert(typeof e.stack === 'string');
  /**
   * @type {import('./severity').error}
   */
  const error = {
    name: e.name,
    code: e.code,
    message: e.message,
    stack: e.stack,
  };
  return error;
};


const severity = { types, codes, extract_error };


module.exports = severity;