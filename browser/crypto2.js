
// @ts-check

// MDN SubtleCrypto
// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/sign
// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest

// Web Cryptography API Examples
// https://diafygi.github.io/webcrypto-examples/
// https://gist.github.com/pedrouid/b4056fd1f754918ddae86b32cf7d803e#hmac

// HOTP: An HMAC-Based One-Time Password Algorithm
// https://datatracker.ietf.org/doc/html/rfc4226

// TOTP: Time-Based One-Time Password Algorithm
// https://datatracker.ietf.org/doc/html/rfc6238

// https://uk.wikipedia.org/wiki/Google_Authenticator
// https://en.wikipedia.org/wiki/Google_Authenticator
// https://en.wikipedia.org/wiki/HMAC-based_one-time_password
// https://en.wikipedia.org/wiki/Time-based_One-Time_Password

// https://github.com/google/google-authenticator/wiki/Key-Uri-Format
// https://thecleancoder.dev/post/gooauth/
// https://gist.github.com/wingkeet/6bed16e5d3ab6975a3ab701d144aee0a


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
 * @param {Uint8Array} buffer
 * @param {number} offset
 * @param {number} value
 */
const write_uint32be = (buffer, offset, value) => {
  assert(buffer instanceof Uint8Array);
  assert(typeof offset === 'number');
  assert(typeof value === 'number');
  let value2 = value;
  buffer[offset + 3] = value2;
  value2 = value2 >>> 8;
  buffer[offset + 2] = value2;
  value2 = value2 >>> 8;
  buffer[offset + 1] = value2;
  value2 = value2 >>> 8;
  buffer[offset + 0] = value2;
};


/**
 * @param {Uint8Array} buffer
 * @param {number} offset
 */
const read_uint32be = (buffer, offset) => {
  assert(buffer instanceof Uint8Array);
  assert(typeof offset === 'number');
  const value = (buffer[offset + 0] * (2 ** 24))
    + (buffer[offset + 1] * (2 ** 16))
    + (buffer[offset + 2] * (2 ** 8))
    + (buffer[offset + 3]);
  return value;
};


/**
 * @param {string} key
 * @param {string} algorithm
 * @param {number} digits
 * @param {number} counter
 * @returns {Promise<string>}
 */
const hotp_code = async (key, algorithm, digits, counter) => {
  assert(typeof key === 'string');
  assert(typeof algorithm === 'string');
  assert(typeof digits === 'number');
  assert(typeof counter === 'number');

  const key_buffer = base32.decode(key.replace(/=/g, ''));

  const counter_buffer = new Uint8Array(8);
  write_uint32be(counter_buffer, 4, counter);

  const signature_buffer = await hmac(algorithm, key_buffer, counter_buffer);

  const offset = signature_buffer[signature_buffer.byteLength - 1] & 0xf;

  const truncated_buffer = signature_buffer.slice(offset, offset + 4);
  truncated_buffer[0] &= 0x7f;

  const truncated_value = read_uint32be(truncated_buffer, 0);

  const code = String(truncated_value % (10 ** digits)).padStart(digits, '0');

  return code;
};


/**
 * @param {string} key
 * @param {string} algorithm
 * @param {number} digits
 * @returns {Promise<string>}
 */
const totp_code = async (key, algorithm, digits) => {
  assert(typeof key === 'string');
  assert(typeof algorithm === 'string');
  assert(typeof digits === 'number');
  const counter = Math.floor(Math.round(Date.now() / 1000) / 30);
  const code = await hotp_code(key, algorithm, digits, counter);
  return code;
};


/**
 * @param {string} type
 * @param {string} issuer
 * @param {string} owner
 * @param {string} secret
 * @param {string} algorithm
 * @param {number} digits
 * @param {number} period
 * @returns {string}
 */
const otp_uri = (type, issuer, owner, secret, algorithm, digits, period) => {
  assert(typeof type === 'string');
  assert(typeof issuer === 'string');
  assert(typeof owner === 'string');
  assert(typeof secret === 'string');
  assert(typeof algorithm === 'string');
  assert(typeof digits === 'number');
  assert(type === 'hotp' || type === 'totp');
  switch (type) {
    case 'hotp': {
      const response = `otpauth://${type}/${issuer}:${owner}?secret=${secret}&algorithm=${algorithm}&digits=${digits}&period=${period}`;
      return response;
    }
    case 'totp': {
      assert(typeof period === 'number');
      const response = `otpauth://${type}/${issuer}:${owner}?secret=${secret}&algorithm=${algorithm}&digits=${digits}&period=${period}`;
      return response;
    }
    default: {
      throw new Error('Invalid type.');
    }
  }
};


const test_totp_code = () => {
  const key = 'WZELRRFMHGY7UZY2GS4OEOTHKG6FK7M2';
  const algorithm = 'SHA-1';
  console.log({ key });

  setInterval(async () => {
    const code = await totp_code(key, algorithm, 6);
    console.log({ code });
    const code2 = await totp_code(key, algorithm, 8);
    console.log({ code2 });
  }, 1000);
};


const crypto2 = {
  hash,
  hmac,
  random_bytes,
  hotp_code,
  totp_code,
  otp_uri,
  test_totp_code,
};


module.exports = crypto2;