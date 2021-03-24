const AssertionError = require('./AssertionError');

/**
 * @param {any[]} values
 * @param {Function} callback
 * @returns {Promise<any>}
 */
const parallel = async (values, callback) => {
  AssertionError.assert(values instanceof Array);
  AssertionError.assert(callback instanceof Function);
  const results = await Promise.all(values.map(callback));
  return results;
};

module.exports = parallel;