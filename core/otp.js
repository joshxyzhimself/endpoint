
// @ts-check

const assert = require('./assert');
const base32 = require('./base32');


// https://github.com/emn178/js-sha1
// https://github.com/emn178/js-sha256
// https://github.com/emn178/js-sha512
// https://github.com/emn178/js-sha3


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


  const sha1 = await crypto.instantiateSha1();
  const state = sha1.update(sha1.init(), key_buffer);
  const hash = sha1.final(state);

  console.log({ hash });


  // const message_buffer = Buffer.alloc(8).fill(0);
  // message_buffer.writeUInt32BE(counter, 4);

  console.log({ counter_buffer });


  // const hash_buffer = crypto.createHmac('sha1', key_buffer).update(message_buffer).digest();
  // const offset = hash_buffer[hash_buffer.byteLength - 1] & 0xf;
  // const truncated_hash_buffer = hash_buffer.slice(offset, offset + 4);
  // truncated_hash_buffer[0] &= 0x7f;
  // const code = String(truncated_hash_buffer.readUInt32BE() % 1000000).padStart(6, '0');
  // return code;
};


const otp = { hotp_derive_code };

module.exports = otp;