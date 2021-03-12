/* eslint-disable no-bitwise */

// https://en.wikipedia.org/wiki/HMAC-based_One-time_Password_algorithm
// https://en.wikipedia.org/wiki/Time-based_One-time_Password_algorithm
// https://pypi.org/project/authenticator/

const assert = require('assert');
const crypto = require('crypto');
const base32 = require('hi-base32');

const hotp_create_key = () => base32.encode(crypto.randomBytes(32)).replace(/=/g, '');

/**
 * @param {string} key
 * @param {number} counter
 * @returns {string}
 */
const hotp_derive_code = (key, counter) => {
  assert(typeof key === 'string');
  assert(typeof counter === 'number');
  const key_buffer = Buffer.from(base32.decode.asBytes(key));
  const message_buffer = Buffer.alloc(8).fill(0);
  message_buffer.writeUInt32BE(counter, 4);
  const hash_buffer = crypto.createHmac('sha1', key_buffer).update(message_buffer).digest();
  const offset = hash_buffer[hash_buffer.byteLength - 1] & 0xf;
  const truncated_hash_buffer = hash_buffer.slice(offset, offset + 4);
  truncated_hash_buffer[0] &= 0x7f;
  const code = String(truncated_hash_buffer.readUInt32BE() % 1000000).padStart(6, '0');
  return code;
};

const totp_get_counter = () => Math.floor(Math.round(Date.now() / 1000) / 30);

/**
 *
 * @param {string} key
 * @param {string} code
 * @param {number} valid_windows
 * @returns
 */
const totp_verify_code = (key, code, valid_windows) => {
  assert(typeof key === 'string');
  assert(typeof code === 'string');
  assert(typeof valid_windows === 'number' && Number.isFinite(valid_windows) === true && valid_windows >= 0);
  const current_counter = totp_get_counter();
  for (let i = 0; i <= valid_windows; i += 1) {
    if (hotp_derive_code(key, current_counter - i) === code) {
      return true;
    }
  }
  return false;
};

module.exports = { hotp_create_key, hotp_derive_code, totp_get_counter, totp_verify_code };