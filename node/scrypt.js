
// @ts-check

const assert = require('assert');
const crypto = require('crypto');

/**
 * References
 * - https://blog.filippo.io/the-scrypt-parameters/
 */

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
 * @returns {Promise<string>}
 */
const derive_key = (password, password_salt) => new Promise((resolve, reject) => {
  try {
    assert(typeof password === 'string');
    assert(typeof password_salt === 'string');
    const password_normalized = password.normalize('NFKC');
    const password_normalized_buffer = Buffer.from(password_normalized);
    const password_salt_buffer = Buffer.from(password_salt, 'hex');
    crypto.scrypt(password_normalized_buffer, password_salt_buffer, config.length, config.options, ((error, password_key_buffer) => {
      if (error instanceof Error) {
        reject(error);
        return;
      }
      const password_key = password_key_buffer.toString('hex');
      resolve(password_key);
    }));
  } catch (e) {
    reject(e);
  }
});

const scrypt = {
  safe_username_regex: /^[A-Za-z0-9_]+$/,
  config,
  create_salt,
  derive_key,
};


module.exports = scrypt;