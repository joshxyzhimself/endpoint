const util = require('util');
const crypto = require('crypto');

/**
 * References
 * - https://blog.filippo.io/the-scrypt-parameters/
 */

const scrypt_derive_key = util.promisify(crypto.scrypt);

const scrypt = {

  // helper, for testing usernames
  safe_username_regex: /^[A-Za-z0-9_]+$/,

  // exposed configurations
  derived_key_length: 64,
  derived_key_options: { N: 2 ** 15, r: 8, p: 1, maxmem: 128 * (2 ** 16) * 8 },

  // core functions
  create_salt: () => crypto.randomBytes(32).toString('hex'),
  derive_key: async (password, password_salt) => {
    if (typeof password !== 'string') {
      throw new Error('scrypt.derive_key(password, password_salt), "password" must be a string');
    }
    if (typeof password_salt !== 'string') {
      throw new Error('scrypt.derive_key(password, password_salt), "password_salt" must be a string');
    }
    const utf8_password_normalized = password.normalize('NFKC');
    const utf8_password_normalized_buffer = Buffer.from(utf8_password_normalized);
    const password_salt_buffer = Buffer.from(password_salt, 'hex');
    const password_key_buffer = await scrypt_derive_key(utf8_password_normalized_buffer, password_salt_buffer,scrypt.derived_key_length,scrypt.derived_key_options);
    const password_key = password_key_buffer.toString('hex');
    return password_key;
  },
};


module.exports = scrypt;