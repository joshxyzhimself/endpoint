
// @ts-check


const crypto = require('crypto');
const assert = require('../core/assert');


/**
 * @param {number} length
 * @returns {Uint8Array}
 */
const random_bytes = (length) => {
  assert(typeof length === 'number');
  const bytes = crypto.randomBytes(length);
  const bytes2 = new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / Uint8Array.BYTES_PER_ELEMENT);
  return bytes2;
};


module.exports = random_bytes;