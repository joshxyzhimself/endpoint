
const AssertionError = require('./AssertionError');
const emitter = require('./emitter');

/**
 *
 * Note that task processing still continues even after the first error.
 *
 * This is intentional, you must handle your task failures within your event callbacks.
 *
 * @param {number} concurrency - queue concurrency
 * @param {Function} callback
 *
 * @example
 *
 * const q = queue(3, async (value) => {
 *   assert(typeof value === 'number');
 *   await new Promise((resolve) => setTimeout(resolve, value));
 *   return value;
 * });
 *
 * q.events.on('result', console.log);
 * q.events.on('drain', console.log);
 * q.events.on('error', console.log);
 *
 * await new Promise((resolve, reject) => {
 *   q.events.on('drain', resolve);
 *   q.events.on('error', reject);
 * });
 */
const queue = (concurrency, callback) => {

  AssertionError.assert(typeof concurrency === 'number');
  AssertionError.assert(Number.isFinite(concurrency) === true);
  AssertionError.assert(Number.isInteger(concurrency) === true);
  AssertionError.assert(concurrency > 0);
  AssertionError.assert(callback instanceof Function);

  let active = 0;
  let paused = false;
  const values = [];
  const events = new emitter();

  const resume = () => {
    if (paused === true) {
      paused = false;
    }
    while (active < concurrency && values.length > 0) {
      if (active === 0) {
        events.emit('resume');
      }
      active += 1;
      const next = values.shift();
      process.nextTick(process_next, next);
    }
  };

  const process_next = async (value) => {
    try {
      const result = await callback(value);
      events.emit('result', result, value);
    } catch (error) {
      events.emit('error', error, value);
    }
    active -= 1;
    if (values.length > 0) {
      if (paused === false) {
        resume();
      }
    } else {
      if (active === 0) {
        events.emit('drain');
      }
    }
  };

  const push = (value) => {
    values.push(value);
    if (paused === false) {
      resume();
    }
  };

  const pause = () => {
    paused = true;
    events.emit('pause');
  };

  return { events, push, pause, resume };
};



module.exports = queue;