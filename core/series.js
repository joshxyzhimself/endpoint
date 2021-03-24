const AssertionError = require('./AssertionError');

/**
 * @param {any[]} values
 * @param {Function} callback
 * @returns {Promise<any>}
 */
const series = async (values, callback) => {
  AssertionError.assert(values instanceof Array);
  AssertionError.assert(callback instanceof Function);
  const results = [];
  for (let index = 0, length = values.length; index < length; index += 1) {
    const value = values[index];
    const result = await callback(value, index);
    results.push(result);
  }
  return results;
};

module.exports = series;