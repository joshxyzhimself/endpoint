
// @ts-check

const assert = require('./assert');

const errors = {
  INVALID_PHONE_NUMBER: {
    code: 'ERR_INVALID_PHONE_NUMBER',
    message: 'Invalid phone number.',
  },
};

/**
 * @param {String} value
 */
const normalize_phone_number = (value) => {
  assert(typeof value === 'string', errors.INVALID_PHONE_NUMBER.code, errors.INVALID_PHONE_NUMBER.message);
  const value2 = value.replace(/[+-]/g, '').trim();
  assert(Number.isFinite(Number(value2)) === true, errors.INVALID_PHONE_NUMBER.code, errors.INVALID_PHONE_NUMBER.message);
  assert(value2.length === 11 || value2.length === 12, errors.INVALID_PHONE_NUMBER.code, errors.INVALID_PHONE_NUMBER.message);
  if (value2.length === 11) {
    assert(value2.substring(0, 2) === '09', errors.INVALID_PHONE_NUMBER.code, errors.INVALID_PHONE_NUMBER.message);
    return value2;
  }
  assert(value2.substring(0, 3) === '639', errors.INVALID_PHONE_NUMBER.code, errors.INVALID_PHONE_NUMBER.message);
  const value3 = '09'.concat(value2.substring(3));
  return value3;
};

module.exports = normalize_phone_number;