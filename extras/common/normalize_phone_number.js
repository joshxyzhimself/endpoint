const AssertionError = require('./AssertionError');

/**
 * @param {String} value
 */
const normalize_phone_number = (value) => {
  AssertionError.assert(typeof value === 'string', 'Invalid phone number.');
  const value2 = value.replace(/[+-]/g, '').trim();
  AssertionError.assert(Number.isFinite(Number(value2)) === true, 'Invalid phone number.');
  AssertionError.assert(value2.length === 11 || value2.length === 12, 'Invalid phone number.');
  if (value2.length === 11) {
    AssertionError.assert(value2.substring(0, 2) === '09', 'Invalid phone number.');
    return value2;
  }
  AssertionError.assert(value2.substring(0, 3) === '639', 'Invalid phone number.');
  const value3 = '09'.concat(value2.substring(3));
  return value3;
};

module.exports = normalize_phone_number;