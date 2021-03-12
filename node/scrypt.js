const util = require('util');
const assert = require('assert');
const crypto = require('crypto');

/**
 * References
 * - https://blog.filippo.io/the-scrypt-parameters/
 */

const scrypt_derive_key = util.promisify(crypto.scrypt);

const config = {
  length: 64,
  options: {
    N: 2 ** 15,
    r: 8,
    p: 1,
    maxmem: 128 * (2 ** 16) * 8,
  },
};

/**
 * @returns {string}
 */
const create_salt = () => crypto.randomBytes(32).toString('hex');

/**
 *
 * @param {string} password
 * @param {string} password_salt
 * @returns {string}
 */
const derive_key = async (password, password_salt) => {
  assert(typeof password === 'string');
  assert(typeof password_salt === 'string');
  const utf8_password_normalized = password.normalize('NFKC');
  const utf8_password_normalized_buffer = Buffer.from(utf8_password_normalized);
  const password_salt_buffer = Buffer.from(password_salt, 'hex');
  const password_key_buffer = await scrypt_derive_key(utf8_password_normalized_buffer, password_salt_buffer, config.length, config.options);
  const password_key = password_key_buffer.toString('hex');
  return password_key;
};

const scrypt = {
  safe_username_regex: /^[A-Za-z0-9_]+$/,
  config,
  create_salt,
  derive_key,
};


module.exports = scrypt;