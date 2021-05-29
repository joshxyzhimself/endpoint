
// @ts-check

const AssertionError = require('./AssertionError');
const assert = AssertionError.assert;

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
  const decimal_padded = decimal.substring(0, decimal_places).padEnd(decimal_places, '0');
  if (decimal_padded === '') {
    return whole;
  }
  const result = `${whole}.${decimal_padded}`;
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
  const decimal_padded = decimal.substring(0, precision).padEnd(precision, '0');
  const scaled = BigInt(`${whole}${decimal_padded}`);
  return scaled;
};

/**
 * @type {import('./arbitrary').unscale}
 */
const unscale = (value) => {
  assert(typeof value === 'bigint');
  const value_padded = 0n <= value
    ? value.toString().padStart(1 + precision, '0')
    : `-${value.toString().replace('-', '').padStart(1 + precision, '0')}`;
  const whole = value_padded.substring(0, value_padded.length - precision);
  const decimal = value_padded.substring(value_padded.length - precision, value_padded.length);
  let decimal_length = decimal.length;
  while (decimal.charAt(decimal_length - 1) === '0') {
    decimal_length -= 1;
  }
  const decimal_substring = decimal.substring(0, decimal_length);
  if (decimal_substring === '') {
    return whole;
  }
  const result = `${whole}.${decimal_substring}`;
  return result;
};

/**
 * @type {import('./arbitrary').add}
 */
const add = (...values) => {
  values.forEach((value) => {
    assert(typeof value === 'string');
  });
  let result = scale(values[0]);
  for (let i = 1, l = values.length; i < l; i += 1) {
    result += scale(values[i]);
  }
  return unscale(result);
};

/**
 * @type {import('./arbitrary').sub}
 */
const sub = (...values) => {
  values.forEach((value) => {
    assert(typeof value === 'string');
  });
  let result = scale(values[0]);
  for (let i = 1, l = values.length; i < l; i += 1) {
    result -= scale(values[i]);
  }
  return unscale(result);
};

/**
 * @type {import('./arbitrary').mul}
 */
const mul = (...values) => {
  values.forEach((value) => {
    assert(typeof value === 'string');
  });
  let result = scale(values[0]);
  for (let i = 1, l = values.length; i < l; i += 1) {
    result = (result * scale(values[i])) / precision_multiplier;
  }
  return unscale(result);
};

/**
 * @type {import('./arbitrary').div}
 */
const div = (...values) => {
  values.forEach((value) => {
    assert(typeof value === 'string');
  });
  let result = scale(values[0]);
  for (let i = 1, l = values.length; i < l; i += 1) {
    result = (result * precision_multiplier) / scale(values[i]);
  }
  return unscale(result);
};

/**
 * @type {import('./arbitrary').gt}
 */
const gt = (left, right) => {
  assert(typeof left === 'string');
  assert(typeof right === 'string');
  return scale(left) > scale(right);
};


/**
 * @type {import('./arbitrary').lt}
 */
const lt = (left, right) => {
  assert(typeof left === 'string');
  assert(typeof right === 'string');
  return scale(left) < scale(right);
};

/**
 * @type {import('./arbitrary').gte}
 */
const gte = (left, right) => {
  assert(typeof left === 'string');
  assert(typeof right === 'string');
  return scale(left) >= scale(right);
};

/**
 * @type {import('./arbitrary').lte}
 */
const lte = (left, right) => {
  assert(typeof left === 'string');
  assert(typeof right === 'string');
  return scale(left) <= scale(right);
};

/**
 * @type {import('./arbitrary').eq}
 */
const eq = (left, right) => {
  assert(typeof left === 'string');
  assert(typeof right === 'string');
  return scale(left) === scale(right);
};

/**
 * @type {import('./arbitrary').neq}
 */
const neq = (left, right) => {
  assert(typeof left === 'string');
  assert(typeof right === 'string');
  return scale(left) !== scale(right);
};

/**
 * @type {import('./arbitrary').abs}
 */
const abs = (value) => {
  assert(typeof value === 'string');
  const scaled_value = scale(value);
  return scaled_value < 0n
    ? unscale(scaled_value * -1n)
    : unscale(scaled_value);
};

/**
 * @type {import('./arbitrary').pow}
 */
const pow = (value, exponent) => {
  assert(typeof value === 'string');
  assert(typeof exponent === 'number');
  assert(Number.isFinite(exponent) === true);
  assert(Number.isInteger(exponent) === true);
  return unscale((scale(value) ** BigInt(exponent)) / ((precision_multiplier) ** BigInt(exponent - 1)));
};

// https://stackoverflow.com/a/64953280

const arbitrary = {
  fix,
  add,
  sub,
  mul,
  div,
  gt,
  lt,
  gte,
  lte,
  eq,
  neq,
  abs,
  pow,
};

module.exports = arbitrary;