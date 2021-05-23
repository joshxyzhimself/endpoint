
// @ts-check

const fs = require('fs');
const path = require('path');
const luxon = require('luxon');
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

const error_types = {
  ERR_INVALID_PARAMETER_TYPE: 'ERR_INVALID_PARAMETER_TYPE',
};

const severity_type_values = new Set(Object.values(severity_types));

const emitter = create_emitter();

/**
 * @type {import('./logger').log}
 */
const log = (id, severity_type, message, data) => {
  AssertionError.assert(typeof id === 'string' || typeof id === 'number', error_types.ERR_INVALID_PARAMETER_TYPE);
  AssertionError.assert(typeof severity_type === 'string', error_types.ERR_INVALID_PARAMETER_TYPE);
  AssertionError.assert(typeof message === 'string', error_types.ERR_INVALID_PARAMETER_TYPE);
  AssertionError.assert(severity_type_values.has(severity_type) === true, error_types.ERR_INVALID_PARAMETER_TYPE);
  AssertionError.assert(data === undefined || data instanceof Object, error_types.ERR_INVALID_PARAMETER_TYPE);
  emitter.emit('*', id, severity_type, message, data);
  emitter.emit(severity_type, id, message, data);
  emitter.emit(id, severity_type, message, data);
};

const console_generic_listener = (id, severity_type, message, data) => {
  AssertionError.assert(typeof id === 'string' || typeof id === 'number', error_types.ERR_INVALID_PARAMETER_TYPE);
  AssertionError.assert(typeof severity_type === 'string', error_types.ERR_INVALID_PARAMETER_TYPE);
  AssertionError.assert(typeof message === 'string', error_types.ERR_INVALID_PARAMETER_TYPE);
  AssertionError.assert(data === undefined || data instanceof Object, error_types.ERR_INVALID_PARAMETER_TYPE);
  const severity_code = severity_codes[severity_type];
  const local = luxon.DateTime.local();
  const local_iso = local.toISO();
  console.log(local_iso);
  console.log(`${id}: ${severity_type} (${severity_code}): ${message}`);
  if (data instanceof Object) {
    console.log(JSON.stringify(data, null, 2));
  }
};

/**
 * @type {import('./logger').to_console}
 */
const to_console = (id) => {
  AssertionError.assert(typeof id === 'string' || typeof id === 'number', error_types.ERR_INVALID_PARAMETER_TYPE);
  if (id === '*') {
    emitter.on(id, console_generic_listener);
    return;
  }
  const console_specific_listener = (severity_type, message, data) => {
    AssertionError.assert(typeof severity_type === 'string', error_types.ERR_INVALID_PARAMETER_TYPE);
    AssertionError.assert(typeof message === 'string', error_types.ERR_INVALID_PARAMETER_TYPE);
    AssertionError.assert(data === undefined || data instanceof Object, error_types.ERR_INVALID_PARAMETER_TYPE);
    const severity_code = severity_codes[severity_type];
    const local = luxon.DateTime.local();
    const local_iso = local.toISO();
    console.log(local_iso);
    console.log(`${id}: ${severity_type} (${severity_code}): ${message}`);
    if (data instanceof Object) {
      console.log(JSON.stringify(data, null, 2));
    }
  };
  emitter.on(id, console_specific_listener);
};

fs.mkdirSync(path.join(process.cwd(), 'temp'), { recursive: true });

const file_generic_listener = (id, severity_type, message, data) => {
  AssertionError.assert(typeof id === 'string' || typeof id === 'number', error_types.ERR_INVALID_PARAMETER_TYPE);
  AssertionError.assert(typeof severity_type === 'string', error_types.ERR_INVALID_PARAMETER_TYPE);
  AssertionError.assert(typeof message === 'string', error_types.ERR_INVALID_PARAMETER_TYPE);
  AssertionError.assert(data === undefined || data instanceof Object, error_types.ERR_INVALID_PARAMETER_TYPE);
  const severity_code = severity_codes[severity_type];
  const local = luxon.DateTime.local();
  const local_iso = local.toISO();
  const file_name = `${local.toFormat('LLL-dd-yyyy-ZZZZ')}.log`;
  const file_path = path.join(process.cwd(), 'temp', file_name);
  fs.appendFileSync(file_path, `\n${local_iso}`);
  fs.appendFileSync(file_path, `\n${id}: ${severity_type} (${severity_code}): ${message}`);
  if (data instanceof Object) {
    fs.appendFileSync(file_path, `\n${JSON.stringify(data, null, 2)}`);
  }
};

/**
 * @type {import('./logger').to_file}
 */
const to_file = (id) => {
  AssertionError.assert(typeof id === 'string' || typeof id === 'number', error_types.ERR_INVALID_PARAMETER_TYPE);
  if (id === '*') {
    emitter.on(id, file_generic_listener);
    return;
  }
  const file_specific_listener = (severity_type, message, data) => {
    AssertionError.assert(typeof severity_type === 'string', error_types.ERR_INVALID_PARAMETER_TYPE);
    AssertionError.assert(typeof message === 'string', error_types.ERR_INVALID_PARAMETER_TYPE);
    AssertionError.assert(data === undefined || data instanceof Object, error_types.ERR_INVALID_PARAMETER_TYPE);
    const severity_code = severity_codes[severity_type];
    const local = luxon.DateTime.local();
    const local_iso = local.toISO();
    const file_name = `${local.toFormat('LLL-dd-yyyy-ZZZZ')}.log`;
    const file_path = path.join(process.cwd(), 'temp', file_name);
    fs.appendFileSync(file_path, `\n${local_iso}`);
    fs.appendFileSync(file_path, `\n${id}: ${severity_type} (${severity_code}): ${message}`);
    if (data instanceof Object) {
      fs.appendFileSync(file_path, `\n${JSON.stringify(data, null, 2)}`);
    }
  };
  emitter.on(id, file_specific_listener);
};

const logger = {
  log,
  to_console,
  to_file,
  severity_types,
  severity_codes,
  error_types,
  on: emitter.on,
  off: emitter.off,
};

module.exports = logger;
