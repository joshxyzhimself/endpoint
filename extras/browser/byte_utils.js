
const assert = require('../common/assert');

/**
 * @param {Uint8Array} value
 */
const bytes_to_hex = (value) => {
  assert(value instanceof Uint8Array);
  return Array.from(value).map((b) => b.toString(16).padStart(2, '0')).join('');
};

/**
 * @param {String} string
 */
const hex_to_bytes = (value) => {
  assert(typeof value === 'string');
  return new Uint8Array(value.match(/.{1,2}/g).map((b) => parseInt(b, 16)));
};

/**
 * @param {Uint8Array} value
 */
const bytes_to_base64 = (value) => {
  assert(value instanceof Uint8Array);
  return window.btoa(Array.from(value).map((b) => String.fromCharCode(b)).join(''));
};

/**
 * @param {String} string
 */
const base64_to_bytes = (value) => {
  assert(typeof value === 'string');
  return Uint8Array.from(window.atob(value), (c) => c.charCodeAt(0));
};

/**
 * @param {Number} size
 */
const random_bytes = (size) => {
  assert(typeof size === 'number');
  return crypto.getRandomValues(new Uint8Array(size));
};

/**
 * @param {Number} size
 */
const random_hex = (size) => {
  assert(typeof size === 'number');
  return bytes_to_hex(random_bytes(size));
};

/**
 * @param {Number} size
 */
const random_base64 = (size) => {
  assert(typeof size === 'number');
  return bytes_to_base64(random_bytes(size));
};

module.exports = {
  bytes_to_hex,
  hex_to_bytes,
  bytes_to_base64,
  base64_to_bytes,
  random_bytes,
  random_hex,
  random_base64,
};