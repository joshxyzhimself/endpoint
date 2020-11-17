const assert = require('assert');
const EventEmitter = require('events');

const emitter = new EventEmitter();

/**
 *  @ https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry#logseverity
 *
 *  DEFAULT	(0) The log entry has no assigned severity level.
 *  DEBUG	(100) Debug or trace information.
 *  INFO	(200) Routine information, such as ongoing status or performance.
 *  NOTICE	(300) Normal but significant events, such as start up, shut down, or a configuration change.
 *  WARNING	(400) Warning events might cause problems.
 *  ERROR	(500) Error events are likely to cause problems.
 *  CRITICAL	(600) Critical events cause more severe problems or outages.
 *  ALERT	(700) A person must take an action immediately.
 *  EMERGENCY	(800) One or more systems are unusable.
 */

const severities = new Set([
  'DEFAULT',
  'DEBUG',
  'INFO',
  'NOTICE',
  'WARNING',
  'ERROR',
  'CRITICAL',
  'ALERT',
  'EMERGENCY',
]);

const log = (severity, message) => {
  assert(typeof severity === 'string');
  assert(typeof message === 'string');
  assert(severities.has(severity) === true);
  const timestamp = Date.now();
  emitter.emit('*', message, timestamp);
  emitter.emit(severity, message, timestamp);
};

module.exports = { log, on: emitter.on.bind(emitter) };