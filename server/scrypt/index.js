const crypto = require('crypto');

/**
 * References
 * - https://blog.filippo.io/the-scrypt-parameters/
 */

const scrypt = {

  // helper, for testing usernames
  safe_username_regex: /^[A-Za-z0-9_]+$/,

  // exposed configurations
  derived_key_length: 64,
  derived_key_options: { N: 2 ** 15, r: 8, p: 1, maxmem: 128 * (2 ** 16) * 8 },

  // core functions
  create_salt: () => crypto.randomBytes(32).toString('hex'),
  derive_key: (utf8_password, hex_salt) => new Promise((resolve, reject) => {
    try {
      if (typeof utf8_password !== 'string') {
        throw Error('scrypt.derive_key(utf8_password, hex_salt), "utf8_password" must be a string');
      }
      if (typeof hex_salt !== 'string') {
        throw Error('scrypt.derive_key(utf8_password, hex_salt), "hex_salt" must be a string');
      }
    } catch (validation_error) {
      reject(validation_error);
      return;
    }
    const utf8_password_normalized = utf8_password.normalize('NFKC');
    crypto.scrypt(
      Buffer.from(utf8_password_normalized),
      Buffer.from(hex_salt, 'hex'),
      scrypt.derived_key_length,
      scrypt.derived_key_options,
      (scrypt_error, scrypt_derived_key) => {
        if (scrypt_error !== null) {
          reject(scrypt_error);
          return;
        }
        resolve(scrypt_derived_key.toString('hex'));
      },
    );
  }),
};

module.exports = scrypt;