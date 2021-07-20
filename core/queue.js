
// @ts-check

const assert = require('./assert');
const create_emitter = require('./create_emitter');

const errors = {
  ERR_INVALID_CONCURRENCY: {
    code: 'ERR_QUEUE_INVALID_CONCURRENCY',
    message: 'Invalid concurrency.',
  },
  ERR_INVALID_CALLBACK: {
    code: 'ERR_QUEUE_INVALID_CALLBACK',
    message: 'Invalid callback.',
  },
};

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

  assert(typeof concurrency === 'number', errors.ERR_INVALID_CONCURRENCY.code, errors.ERR_INVALID_CONCURRENCY.message);
  assert(Number.isFinite(concurrency) === true, errors.ERR_INVALID_CONCURRENCY.code, errors.ERR_INVALID_CONCURRENCY.message);
  assert(Number.isInteger(concurrency) === true, errors.ERR_INVALID_CONCURRENCY.code, errors.ERR_INVALID_CONCURRENCY.message);
  assert(concurrency > 0, errors.ERR_INVALID_CONCURRENCY.code, errors.ERR_INVALID_CONCURRENCY.message);
  assert(callback instanceof Function, errors.ERR_INVALID_CALLBACK.code, errors.ERR_INVALID_CALLBACK.message);

  let active = 0;
  let paused = false;
  const values = [];
  const events = create_emitter();

  const next = () => {
    active += 1;
    const next_value = values.shift();
    process.nextTick(process_next, next_value);
  };

  const resume = () => {
    if (paused === true) {
      paused = false;
    }
    while (active < concurrency && values.length > 0) {
      if (active === 0) {
        events.emit('resume');
      }
      next();
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
        next();
      }
    } else {
      if (active === 0) {
        events.emit('drain');
      }
    }
  };

  const unshift = (...new_values) => {
    values.unshift(...new_values);
    if (paused === false && active === 0) {
      next();
    }
  };

  const push = (...new_values) => {
    values.push(...new_values);
    if (paused === false && active === 0) {
      next();
    }
  };

  const pause = () => {
    if (paused === false) {
      paused = true;
      events.emit('pause');
    }
  };

  const q = {
    values,
    events,
    unshift,
    push,
    pause,
    resume,
    active: () => active,
    paused: () => paused,
  };

  return q;
};



module.exports = queue;