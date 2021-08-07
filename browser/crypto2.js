
// @ts-check


// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/sign
// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
// https://gist.github.com/pedrouid/b4056fd1f754918ddae86b32cf7d803e#hmac
// return new Uint8Array(await window.crypto.subtle.digest('SHA-256', data));
// return createHash('sha256').update(data).digest();
// https://github.com/joshxyzhimself/internals/blob/master/crypto/hotp.js


const assert = require('../core/assert');
const base32 = require('../core/base32');


/**
 * @param {string} algorithm
 * @param {Uint8Array} data
 * @returns {Promise<Uint8Array>}
 */
const hash = async (algorithm, data) => {
  assert(typeof algorithm === 'string');
  assert(data instanceof Uint8Array);
  const arraybuffer = await window.crypto.subtle.digest(algorithm, data.buffer);
  const response = new Uint8Array(arraybuffer);
  return response;
};


/**
 * @param {string} algorithm
 * @param {Uint8Array} key
 * @param {Uint8Array} data
 * @returns {Promise<Uint8Array>}
 */
const hmac = async (algorithm, key, data) => {
  assert(typeof algorithm === 'string');
  assert(key instanceof Uint8Array);
  assert(data instanceof Uint8Array);
  const crypto_key = await window.crypto.subtle.importKey(
    'raw',
    key.buffer,
    { name: 'HMAC', hash: { name: algorithm } },
    false,
    ['sign'],
  );
  const arraybuffer = await window.crypto.subtle.sign(
    { name: 'HMAC' },
    crypto_key,
    data.buffer,
  );
  const response = new Uint8Array(arraybuffer);
  return response;
};


/**
 * @param {number} length
 * @returns {Uint8Array}
 */
const random_bytes = (length) => {
  assert(typeof length === 'number');
  const bytes = window.crypto.getRandomValues(new Uint8Array(length));
  return bytes;
};



/**
 * @param {string} key
 * @param {number} counter
 * @returns {string}
 */
const hotp_derive_code = async (key, counter) => {
  assert(typeof key === 'string');
  assert(typeof counter === 'number');

  const key_buffer = base32.decode(key);

  const uint32_array = new Uint32Array(1);
  uint32_array[0] = counter;
  const counter_buffer = new Uint8Array(uint32_array.buffer);

  console.log({ key_buffer, counter_buffer });
};


const crypto2 = { hash, hmac, random_bytes };


module.exports = crypto2;