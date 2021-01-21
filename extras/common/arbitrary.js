
const AssertionError = require('./AssertionError');

let precision = 2;
let precision_multiplier = 10n ** BigInt(precision);
let max_safe_integer = BigInt(Number.MAX_SAFE_INTEGER) * precision_multiplier;

/**
 * @param {Number} value
 */
const set_precision = (value) => {
  AssertionError.assert(typeof value === 'number');
  AssertionError.assert(Number.isFinite(value) === true);
  AssertionError.assert(Number.isInteger(value) === true);
  precision = value;
  precision_multiplier = 10n ** BigInt(precision);
  max_safe_integer = BigInt(Number.MAX_SAFE_INTEGER) * precision_multiplier;
};

/**
 * @param {Number} value
 */
const to_bigint = (value) => {
  AssertionError.assert(typeof value === 'number');
  AssertionError.assert(Number.isFinite(value) === true);
  return BigInt(value.toFixed(precision).replace('.', ''));
};

/**
 * @param {BigInt} value
 * @param {Number} decimal_places
 */
const to_number = (value) => {
  AssertionError.assert(typeof value === 'bigint');
  AssertionError.assert(value <= max_safe_integer);
  const value_string = value.toString().padStart(2 + precision, '0');
  const whole = value_string.substring(0, value_string.length - precision);
  const decimal = value_string.substring(value_string.length - precision, value_string.length);
  const result = Number(`${whole}.${decimal}`);
  return result;
};

/**
 * @param  {Number[]} values
 */
const add = (...values) => to_number(values.reduce((previous, current) => previous === null ? to_bigint(current) : previous + to_bigint(current), null));
const subtract = (...values) => to_number(values.reduce((previous, current) => previous === null ? to_bigint(current) : previous - to_bigint(current), null));
const multiply = (...values) => to_number(values.reduce((previous, current) => previous === null ? to_bigint(current) : (previous * to_bigint(current)) / precision_multiplier, null));
const divide = (...values) => to_number(values.reduce((previous, current) => previous === null ? to_bigint(current) : (previous * precision_multiplier) / to_bigint(current), null));

const arbitrary = { set_precision, add, subtract, multiply, divide };

module.exports = arbitrary;