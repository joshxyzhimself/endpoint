
// @ts-check


// - https://datatracker.ietf.org/doc/html/rfc4648
// - https://www.rfcreader.com/#rfc4648
// - https://github.com/LinusU/base32-encode
// - https://github.com/LinusU/base32-decode


const assert = require('./assert');


const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';


/**
 * @param {Uint8Array} data
 * @returns {string}
 */
const encode = (data) => {
  assert(data instanceof Uint8Array);

  const dataview = new DataView(data.buffer, data.byteOffset, data.byteLength);

  let bits = 0;
  let value = 0;
  let response = '';

  for (let i = 0, l = dataview.byteLength; i < l; i += 1) {
    value = (value << 8) | dataview.getUint8(i);
    bits += 8;
    while (bits >= 5) {
      const character_index = (value >>> (bits - 5)) & 31;
      const character = characters[character_index];
      assert(typeof character === 'string');
      response += character;
      bits -= 5;
    }
  }

  if (bits > 0) {
    const character_index = (value >>> (bits - 5)) & 31;
    const character = characters[character_index];
    assert(typeof character === 'string');
    response += character;
  }

  while ((response.length % 8) !== 0) {
    response += '=';
  }

  return response;
};


const get_character_index = (character) => {
  const character_index = characters.indexOf(character);
  assert(character_index !== -1, 'ERR_INVALID_CHARACTER', 'Invalid character.');
  return character_index;
};


/**
 * @param {string} data
 * @returns {Uint8Array}
 */
const decode = (data) => {
  assert(typeof data === 'string');

  const data2 = data.replace(/=+$/, '');
  const length = data2.length;
  const response = new Uint8Array((length * 5 / 8) | 0);

  let bits = 0;
  let value = 0;
  let index = 0;

  for (let i = 0; i < length; i++) {
    value = (value << 5) | get_character_index(data2[i]);
    bits += 5;
    if (bits >= 8) {
      response[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }

  return response;
};

const base32 = { encode, decode };

module.exports = base32;