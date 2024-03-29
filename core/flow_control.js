
// @ts-check

const assert = require('./assert');

const errors = {
  INVALID_VALUES: {
    code: 'ERR_FLOW_CONTROL_INVALID_VALUES',
    message: 'Invalid values.',
  },
  INVALID_CALLBACK: {
    code: 'ERR_FLOW_CONTROL_INVALID_CALLBACK',
    message: 'Invalid callback.',
  },
  INVALID_TIMEOUT: {
    code: 'ERR_FLOW_CONTROL_INVALID_TIMEOUT',
    message: 'Invalid timeout.',
  },
};

/**
 * @param {any[]} values
 * @param {Function} callback
 * @returns {Promise<any>}
 */
const series = async (values, callback) => {
  assert(values instanceof Array, errors.INVALID_VALUES.code, errors.INVALID_VALUES.message);
  assert(callback instanceof Function, errors.INVALID_CALLBACK.code, errors.INVALID_CALLBACK.message);
  const results = [];
  for (let index = 0, length = values.length; index < length; index += 1) {
    const value = values[index];
    const result = await callback(value, index);
    results.push(result);
  }
  return results;
};

/**
 * @param {any[]} values
 * @param {Function} callback
 * @returns {Promise<any>}
 */
const parallel = async (values, callback) => {
  assert(values instanceof Array, errors.INVALID_VALUES.code, errors.INVALID_VALUES.message);
  assert(callback instanceof Function, errors.INVALID_CALLBACK.code, errors.INVALID_CALLBACK.message);
  const results = await Promise.all(values.map((value, index) => callback(value, index)));
  return results;
};

/**
 * @param {number} timeout
 */
const sleep = async (timeout) => {
  assert(typeof timeout === 'number', errors.INVALID_TIMEOUT.code, errors.INVALID_TIMEOUT.message);
  await new Promise((resolve) => setTimeout(resolve, timeout));
};

const flow_control = { series, parallel, sleep };

module.exports = flow_control;