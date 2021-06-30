
// @ts-check

const AssertionError = require('./AssertionError');

const errors = {
  INVALID_VALUES: {
    code: 'ERR_CONTROL_FLOW_INVALID_VALUES',
    message: 'Invalid values.',
  },
  INVALID_CALLBACK: {
    code: 'ERR_CONTROL_FLOW_INVALID_CALLBACK',
    message: 'Invalid callback.',
  },
  INVALID_TIMEOUT: {
    code: 'ERR_CONTROL_FLOW_INVALID_TIMEOUT',
    message: 'Invalid timeout.',
  },
};

/**
 * @param {any[]} values
 * @param {Function} callback
 * @returns {Promise<any>}
 */
const series = async (values, callback) => {
  AssertionError.assert(values instanceof Array, errors.INVALID_VALUES.code, errors.INVALID_VALUES.message);
  AssertionError.assert(callback instanceof Function, errors.INVALID_CALLBACK.code, errors.INVALID_CALLBACK.message);
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
  AssertionError.assert(values instanceof Array, errors.INVALID_VALUES.code, errors.INVALID_VALUES.message);
  AssertionError.assert(callback instanceof Function, errors.INVALID_CALLBACK.code, errors.INVALID_CALLBACK.message);
  const results = await Promise.all(values.map((value, index) => callback(value, index)));
  return results;
};

const sleep = async (timeout) => {
  AssertionError.assert(typeof timeout === 'number', errors.INVALID_TIMEOUT.code, errors.INVALID_TIMEOUT.message);
  await new Promise((resolve) => setTimeout(resolve, timeout));
};

const control_flow = { series, parallel, sleep };

module.exports = control_flow;