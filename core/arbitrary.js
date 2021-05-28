
// @ts-check

const assert = require('assert');

const precision = 32;
const precision_multiplier = 10n ** BigInt(precision);

/**
 * @type {import('./arbitrary').fix}
 */
const fix = (value, decimal_places) => {
  assert(typeof value === 'string');
  assert(typeof decimal_places === 'number');
  assert(Number.isFinite(decimal_places) === true);
  assert(Number.isInteger(decimal_places) === true);
  assert(0 <= decimal_places && decimal_places <= precision);
  const values = value.split('.');
  const whole = values[0] || '0';
  const decimal = values[1] || '0';
  assert(Number.isFinite(Number(whole)) === true);
  assert(Number.isFinite(Number(decimal)) === true);
  const decimal2 = decimal.substring(0, decimal_places).padEnd(decimal_places, '0');
  if (decimal2 === '') {
    return whole;
  }
  const result = [whole, decimal2].join('.');
  return result;
};

/**
 * @type {import('./arbitrary').scale}
 */
const scale = (value) => {
  assert(typeof value === 'string');
  const values = value.split('.');
  const whole = values[0] || '0';
  const decimal = values[1] || '0';
  assert(Number.isFinite(Number(whole)) === true);
  assert(Number.isFinite(Number(decimal)) === true);
  const decimal2 = decimal.substring(0, precision).padEnd(precision, '0');
  const scaled = BigInt([whole, decimal2].join(''));
  return scaled;
};

/**
 * @type {import('./arbitrary').unscale}
 */
const unscale = (scaled) => {
  assert(typeof scaled === 'bigint');
  const scaled_string = 0n <= scaled ? scaled.toString().padStart(1 + precision, '0') : '-'.concat(scaled.toString().replace('-', '').padStart(1 + precision, '0'));
  const whole = scaled_string.substring(0, scaled_string.length - precision);
  const decimal = scaled_string.substring(scaled_string.length - precision, scaled_string.length);
  let decimal_length = decimal.length;
  while (decimal.charAt(decimal_length - 1) === '0') {
    decimal_length -= 1;
  }
  const decimal2 = decimal.substring(0, decimal_length);
  if (decimal2 === '') {
    return whole;
  }
  const result = [whole, decimal2].join('.');
  return result;
};

/**
 * @type {import('./arbitrary').add}
 */
const add = (...values) => {
  let result = scale(values[0]);
  for (let i = 1, l = values.length; i < l; i += 1) {
    result += scale(values[i]);
  }
  return unscale(result);
};

/**
 * @type {import('./arbitrary').subtract}
 */
const subtract = (...values) => {
  let result = scale(values[0]);
  for (let i = 1, l = values.length; i < l; i += 1) {
    result -= scale(values[i]);
  }
  return unscale(result);
};

/**
 * @type {import('./arbitrary').multiply}
 */
const multiply = (...values) => {
  let result = scale(values[0]);
  for (let i = 1, l = values.length; i < l; i += 1) {
    result = (result * scale(values[i])) / precision_multiplier;
  }
  return unscale(result);
};

/**
 * @type {import('./arbitrary').divide}
 */
const divide = (...values) => {
  let result = scale(values[0]);
  for (let i = 1, l = values.length; i < l; i += 1) {
    result = (result * precision_multiplier) / scale(values[i]);
  }
  return unscale(result);
};

const arbitrary = { fix, add, subtract, multiply, divide };

module.exports = arbitrary;