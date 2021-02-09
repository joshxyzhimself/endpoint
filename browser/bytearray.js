
const AssertionError = require('./AssertionError');

let type_index = 127;

const boolean_false_type = type_index += 1;
const boolean_true_type = type_index += 1;
const null_type = type_index += 1;

const str8_type = type_index += 1;
const str16_type = type_index += 1;
const str32_type = type_index += 1;

const uint8_type = type_index += 1;
const uint16_type = type_index += 1;
const uint32_type = type_index += 1;
const uint53_type = type_index += 1;

const negative_uint8_type = type_index += 1;
const negative_uint16_type = type_index += 1;
const negative_uint32_type = type_index += 1;
const negative_uint53_type = type_index += 1;

const float32_type = type_index += 1;
const float64_type = type_index += 1;
const bigint_type = type_index += 1;

const array8_type = type_index += 1;
const array16_type = type_index += 1;
const array32_type = type_index += 1;

const map8_type = type_index += 1;
const map16_type = type_index += 1;
const map32_type = type_index += 1;

const bin8_type = type_index += 1;
const bin16_type = type_index += 1;
const bin32_type = type_index += 1;

const text_encoder = new TextEncoder();
const text_decoder = new TextDecoder();

const uint16_array = new Uint16Array(1);
const uint8_uint16_array = new Uint8Array(uint16_array.buffer);

const uint32_array = new Uint32Array(1);
const uint8_uint32_array = new Uint8Array(uint32_array.buffer);

const float32_array = new Float32Array(1);
const uint8_float32_array = new Uint8Array(float32_array.buffer);

const float64_array = new Float64Array(1);
const uint8_float64_array = new Uint8Array(float64_array.buffer);

let bigint64_array = null;
let uint8_bigint64_array = null;

let max_bigint = null;
let min_bigint = null;

// https://caniuse.com/bigint
// https://caniuse.com/mdn-javascript_builtins_bigint64array
const bigint_supported = typeof BigInt === 'function' && typeof BigInt64Array === 'function';

if (bigint_supported === true) {
  bigint64_array = new BigInt64Array(1);
  uint8_bigint64_array = new Uint8Array(bigint64_array.buffer);

  max_bigint = (2n ** 63n) - 1n;
  min_bigint = max_bigint * -1n;
}


const encode = (data) => {
  switch (typeof data) {
    case 'boolean': {
      const buffer = new Uint8Array(1);
      const key = data === true ? boolean_true_type : boolean_false_type;
      buffer[0] = key;
      return buffer;
    }
    case 'string': {
      const data_buffer = text_encoder.encode(data);
      if (data_buffer.length < 258) {
        const buffer = new Uint8Array(data_buffer.byteLength + 2);
        buffer[0] = str8_type;
        buffer[1] = data_buffer.length;
        buffer.set(data_buffer, 2);
        return buffer;
      }
      if (data_buffer.length < 65536) {
        const buffer = new Uint8Array(data_buffer.byteLength + 3);
        uint16_array[0] = data_buffer.length;
        buffer[0] = str16_type;
        buffer[1] = uint8_uint16_array[0];
        buffer[2] = uint8_uint16_array[1];
        buffer.set(data_buffer, 3);
        return buffer;
      }
      if (data_buffer.length < 4294967296) {
        const buffer = new Uint8Array(data_buffer.byteLength + 5);
        uint32_array[0] = data_buffer.length;
        buffer[0] = str32_type;
        buffer[1] = uint8_uint32_array[0];
        buffer[2] = uint8_uint32_array[1];
        buffer[3] = uint8_uint32_array[2];
        buffer[4] = uint8_uint32_array[3];
        buffer.set(data_buffer, 5);
        return buffer;
      }
      throw new Error('encoder: max str length is (2^32) - 1');
    }
    case 'number': {
      if (Number.isNaN(data) === true) { // NaN
        throw new Error('encoder: NaN not supported, not JSON compliant.');
      }
      if (Number.isFinite(data) === false) {
        if (data === Infinity) { // +infinity
          throw new Error('encoder: +Infinity not supported, not JSON compliant');
        } else { // -infinity
          throw new Error('encoder: -Infinity not supported, not JSON compliant');
        }
      }
      if (Math.floor(data) !== data) {
        if (Math.fround(data) === data) { // float_32
          const key = float32_type;
          const buffer = new Uint8Array(5);
          float32_array[0] = data;
          buffer[0] = key;
          buffer[1] = uint8_float32_array[0];
          buffer[2] = uint8_float32_array[1];
          buffer[3] = uint8_float32_array[2];
          buffer[4] = uint8_float32_array[3];
          return buffer;
        } else { // float_64 / double
          const key = float64_type;
          const buffer = new Uint8Array(9);
          float64_array[0] = data;
          buffer[0] = key;
          buffer[1] = uint8_float64_array[0];
          buffer[2] = uint8_float64_array[1];
          buffer[3] = uint8_float64_array[2];
          buffer[4] = uint8_float64_array[3];
          buffer[5] = uint8_float64_array[4];
          buffer[6] = uint8_float64_array[5];
          buffer[7] = uint8_float64_array[6];
          buffer[8] = uint8_float64_array[7];
          return buffer;
        }
      }
      const is_gte_zero = data >= 0;
      const absolute_value = Math.abs(data);
      if (absolute_value < 256) { // (2^8) - 1
        if (absolute_value < 128 && is_gte_zero === true) {
          const buffer = new Uint8Array(1);
          buffer[0] = absolute_value;
          return buffer;
        }
        const key = is_gte_zero ? uint8_type : negative_uint8_type;
        const buffer = new Uint8Array(2);
        buffer[0] = key;
        buffer[1] = absolute_value;
        return buffer;
      }
      if (absolute_value < 65536) { // (2^16) - 1
        const key = is_gte_zero ? uint16_type : negative_uint16_type;
        const buffer = new Uint8Array(3);
        uint16_array[0] = absolute_value;
        buffer[0] = key;
        buffer[1] = uint8_uint16_array[0];
        buffer[2] = uint8_uint16_array[1];
        return buffer;
      }
      if (absolute_value < 4294967296) { // (2^32) - 1
        const key = is_gte_zero ? uint32_type : negative_uint32_type;
        const buffer = new Uint8Array(5);
        uint32_array[0] = absolute_value;
        buffer[0] = key;
        buffer[1] = uint8_uint32_array[0];
        buffer[2] = uint8_uint32_array[1];
        buffer[3] = uint8_uint32_array[2];
        buffer[4] = uint8_uint32_array[3];
        return buffer;
      }
      if (absolute_value <= Number.MAX_SAFE_INTEGER) { // (2^53) - 1
        const key = is_gte_zero ? uint53_type : negative_uint53_type;
        const buffer = new Uint8Array(9);

        let L = (absolute_value % 0x0100000000);
        buffer[8] = L;
        buffer[7] = L = L >>> 8;
        buffer[6] = L = L >>> 8;
        buffer[5] = L = L >>> 8;

        let H = ~~(absolute_value / 0x0100000000);
        buffer[4] = H;
        buffer[3] = H = H >>> 8;
        buffer[2] = H = H >>> 8;
        buffer[1] = H = H >>> 8;
        buffer[0] = key;

        return buffer;
      }
      throw new Error('encoder: min and max safe integer is capped at (2^53) - 1.');
    }
    case 'bigint': {
      if (bigint_supported === false) {
        throw new Error('encoder: BigInt & BigInt64Array support missing, please update your browser.');
      }
      if (data >= min_bigint && data <= max_bigint) { // (2^63) - 1
        const key = bigint_type;
        const buffer = new Uint8Array(9);
        bigint64_array[0] = BigInt(data);
        buffer[0] = key;
        buffer[1] = uint8_bigint64_array[0];
        buffer[2] = uint8_bigint64_array[1];
        buffer[3] = uint8_bigint64_array[2];
        buffer[4] = uint8_bigint64_array[3];
        buffer[5] = uint8_bigint64_array[4];
        buffer[6] = uint8_bigint64_array[5];
        buffer[7] = uint8_bigint64_array[6];
        buffer[8] = uint8_bigint64_array[7];
        return buffer;
      }
      throw new Error('encoder: min and max bigint is capped at (2^63) - 1.');
    }
    case 'object': {
      if (data === null) { // null
        const key = null_type;
        const buffer = new Uint8Array(1);
        buffer[0] = key;
        return buffer;
      }
      if (data instanceof Uint8Array) {
        if (data.byteLength < 258) {
          const buffer = new Uint8Array(data.byteLength + 2);
          buffer[0] = bin8_type;
          buffer[1] = data.byteLength;
          buffer.set(data, 2);
          return buffer;
        }
        if (data.byteLength < 65536) {
          const buffer = new Uint8Array(data.byteLength + 3);
          uint16_array[0] = data.byteLength;
          buffer[0] = bin16_type;
          buffer[1] = uint8_uint16_array[0];
          buffer[2] = uint8_uint16_array[1];
          buffer.set(data, 3);
          return buffer;
        }
        if (data.byteLength < 4294967296) {
          const buffer = new Uint8Array(data.byteLength + 5);
          uint32_array[0] = data.byteLength;
          buffer[0] = bin32_type;
          buffer[1] = uint8_uint32_array[0];
          buffer[2] = uint8_uint32_array[1];
          buffer[3] = uint8_uint32_array[2];
          buffer[4] = uint8_uint32_array[3];
          buffer.set(data, 5);
          return buffer;
        }
        throw new Error('encoder: max bin length is (2^32) - 1');
      }
      if (data instanceof Array) {

        let bytelength = 0;

        const value_buffers = new Array(data.length);
        data.forEach((value, value_index) => {
          const value_buffer = encode(value);
          value_buffers[value_index] = value_buffer;
          bytelength += value_buffer.byteLength;
        });

        let buffer = null;
        let offset = -1;

        if (data.length < 258) {
          buffer = new Uint8Array(bytelength + 2);
          buffer[offset += 1] = array8_type;
          buffer[offset += 1] = data.length;
        } else if (data.length < 65536) {
          buffer = new Uint8Array(bytelength + 3);
          uint16_array[0] = data.length;
          buffer[offset += 1] = array16_type;
          buffer[offset += 1] = uint8_uint16_array[0];
          buffer[offset += 1] = uint8_uint16_array[1];
        } else if (data.length < 4294967296) {
          buffer = new Uint8Array(bytelength + 5);
          uint32_array[0] = data.length;
          buffer[offset += 1] = array32_type;
          buffer[offset += 1] = uint8_uint32_array[0];
          buffer[offset += 1] = uint8_uint32_array[1];
          buffer[offset += 1] = uint8_uint32_array[2];
          buffer[offset += 1] = uint8_uint32_array[3];
        } else {
          throw new Error('encoder: max array length is (2^32) - 1');
        }

        value_buffers.map((value_buffer) => {
          buffer.set(value_buffer, offset += 1);
          offset += value_buffer.byteLength - 1;
        });

        return buffer;
      }
      if (data instanceof Object) {

        let bytelength = 0;

        const keys = Object.keys(data);
        const entry_buffers = new Array(keys.length * 2);
        keys.forEach((key, key_index) => {
          const value = data[key];
          const key_buffer = encode(key);
          const value_buffer = encode(value);
          entry_buffers[key_index * 2] = key_buffer;
          entry_buffers[(key_index * 2) + 1] = value_buffer;
          bytelength += key_buffer.byteLength;
          bytelength += value_buffer.byteLength;
        });

        let buffer = null;
        let offset = -1;

        if (keys.length < 258) {
          buffer = new Uint8Array(bytelength + 2);
          buffer[offset += 1] = map8_type;
          buffer[offset += 1] = keys.length;
        } else if (keys.length < 65536) {
          buffer = new Uint8Array(bytelength + 3);
          uint16_array[0] = keys.length;
          buffer[offset += 1] = map16_type;
          buffer[offset += 1] = uint8_uint16_array[0];
          buffer[offset += 1] = uint8_uint16_array[1];
        } else if (keys.length < 4294967296) {
          buffer = new Uint8Array(bytelength + 5);
          uint32_array[0] = keys.length;
          buffer[offset += 1] = map32_type;
          buffer[offset += 1] = uint8_uint32_array[0];
          buffer[offset += 1] = uint8_uint32_array[1];
          buffer[offset += 1] = uint8_uint32_array[2];
          buffer[offset += 1] = uint8_uint32_array[3];
        } else {
          throw new Error('encoder: max map length is (2^32) - 1');
        }

        entry_buffers.map((entry_buffer) => {
          buffer.set(entry_buffer, offset += 1);
          offset += entry_buffer.byteLength - 1;
        });
        return buffer;
      }
      throw new Error('encoder: unknown object type.');
    }
    default: {
      throw new Error('encoder: unknown data type.');
    }
  }
};

const buffer_to_hex = (buffer) => Array.from(buffer).map((b) => b.toString(16).padStart(2, '0')).join('');

/**
 * @param {Uint8Array} buffer
 */
const decode = (buffer) => {
  AssertionError.assert(buffer instanceof Uint8Array);

  if (buffer._offset === undefined) {
    buffer._offset = -1;
  }

  const type = buffer[buffer._offset += 1];

  if (type < 128) {
    const value = type;
    return value;
  }

  switch (type) {
    case boolean_false_type: {
      return false;
    }
    case boolean_true_type: {
      return true;
    }
    case null_type: {
      return null;
    }
    case str8_type:
    case str16_type:
    case str32_type: {
      let bytelength = null;
      if (type === str8_type) {
        bytelength = buffer[buffer._offset += 1];
      } else if (type === str16_type) {
        uint8_uint16_array[0] = buffer[buffer._offset += 1];
        uint8_uint16_array[1] = buffer[buffer._offset += 1];
        bytelength = uint16_array[0];
      } else {
        uint8_uint32_array[0] = buffer[buffer._offset += 1];
        uint8_uint32_array[1] = buffer[buffer._offset += 1];
        uint8_uint32_array[2] = buffer[buffer._offset += 1];
        uint8_uint32_array[3] = buffer[buffer._offset += 1];
        bytelength = uint32_array[0];
      }
      const value = text_decoder.decode(buffer.slice(buffer._offset += 1, buffer._offset + bytelength));
      buffer._offset += bytelength - 1;
      return value;
    }
    case uint8_type:
    case negative_uint8_type: {
      let value = buffer[buffer._offset += 1];
      if (type === negative_uint8_type) {
        value *= -1;
      }
      return value;
    }
    case uint16_type:
    case negative_uint16_type: {
      uint8_uint16_array[0] = buffer[buffer._offset += 1];
      uint8_uint16_array[1] = buffer[buffer._offset += 1];
      let value = uint16_array[0];
      if (type === negative_uint16_type) {
        value *= -1;
      }
      return value;
    }
    case uint32_type:
    case negative_uint32_type: {
      uint8_uint32_array[0] = buffer[buffer._offset += 1];
      uint8_uint32_array[1] = buffer[buffer._offset += 1];
      uint8_uint32_array[2] = buffer[buffer._offset += 1];
      uint8_uint32_array[3] = buffer[buffer._offset += 1];
      let value = uint32_array[0];
      if (type === negative_uint32_type) {
        value *= -1;
      }
      return value;
    }
    case uint53_type:
    case negative_uint53_type: {
      const bytelength = 8;
      const sliced_buffer = buffer.slice(buffer._offset += 1, buffer._offset + bytelength);
      buffer._offset += bytelength - 1;
      let value = parseInt(buffer_to_hex(sliced_buffer), 16);
      if (type === negative_uint53_type) {
        value *= -1;
      }
      return value;
    }
    case float32_type: {
      uint8_float32_array[0] = buffer[buffer._offset += 1];
      uint8_float32_array[1] = buffer[buffer._offset += 1];
      uint8_float32_array[2] = buffer[buffer._offset += 1];
      uint8_float32_array[3] = buffer[buffer._offset += 1];
      const value = float32_array[0];
      return value;
    }
    case float64_type: {
      uint8_float64_array[0] = buffer[buffer._offset += 1];
      uint8_float64_array[1] = buffer[buffer._offset += 1];
      uint8_float64_array[2] = buffer[buffer._offset += 1];
      uint8_float64_array[3] = buffer[buffer._offset += 1];
      uint8_float64_array[4] = buffer[buffer._offset += 1];
      uint8_float64_array[5] = buffer[buffer._offset += 1];
      uint8_float64_array[6] = buffer[buffer._offset += 1];
      uint8_float64_array[7] = buffer[buffer._offset += 1];
      const value = float64_array[0];
      return value;
    }
    case bigint_type: {
      if (bigint_supported === false) {
        throw new Error('decoder: BigInt & BigInt64Array support missing, please update your browser.');
      }
      uint8_bigint64_array[0] = buffer[buffer._offset += 1];
      uint8_bigint64_array[1] = buffer[buffer._offset += 1];
      uint8_bigint64_array[2] = buffer[buffer._offset += 1];
      uint8_bigint64_array[3] = buffer[buffer._offset += 1];
      uint8_bigint64_array[4] = buffer[buffer._offset += 1];
      uint8_bigint64_array[5] = buffer[buffer._offset += 1];
      uint8_bigint64_array[6] = buffer[buffer._offset += 1];
      uint8_bigint64_array[7] = buffer[buffer._offset += 1];
      const value = bigint64_array[0];
      return value;
    }
    case array8_type:
    case array16_type:
    case array32_type: {
      let length = null;
      if (type === array8_type) {
        length = buffer[buffer._offset += 1];
      } else if (type === array16_type) {
        uint8_uint16_array[0] = buffer[buffer._offset += 1];
        uint8_uint16_array[1] = buffer[buffer._offset += 1];
        length = uint16_array[0];
      } else {
        uint8_uint32_array[0] = buffer[buffer._offset += 1];
        uint8_uint32_array[1] = buffer[buffer._offset += 1];
        uint8_uint32_array[2] = buffer[buffer._offset += 1];
        uint8_uint32_array[3] = buffer[buffer._offset += 1];
        length = uint32_array[0];
      }
      const values = new Array(length);
      for (let i = 0, l = length; i < l; i += 1) {
        values[i] = decode(buffer);
      }
      return values;
    }
    case map8_type:
    case map16_type:
    case map32_type: {
      let length = null;
      if (type === map8_type) {
        length = buffer[buffer._offset += 1];
      } else if (type === map16_type) {
        uint8_uint16_array[0] = buffer[buffer._offset += 1];
        uint8_uint16_array[1] = buffer[buffer._offset += 1];
        length = uint16_array[0];
      } else {
        uint8_uint32_array[0] = buffer[buffer._offset += 1];
        uint8_uint32_array[1] = buffer[buffer._offset += 1];
        uint8_uint32_array[2] = buffer[buffer._offset += 1];
        uint8_uint32_array[3] = buffer[buffer._offset += 1];
        length = uint32_array[0];
      }
      const value = {};
      for (let i = 0, l = length; i < l; i += 1) {
        value[decode(buffer)] = decode(buffer);
      }
      return value;
    }
    case bin8_type:
    case bin16_type:
    case bin32_type: {
      let bytelength = null;
      if (type === bin8_type) {
        bytelength = buffer[buffer._offset += 1];
      } else if (type === bin16_type) {
        uint8_uint16_array[0] = buffer[buffer._offset += 1];
        uint8_uint16_array[1] = buffer[buffer._offset += 1];
        bytelength = uint16_array[0];
      } else {
        uint8_uint32_array[0] = buffer[buffer._offset += 1];
        uint8_uint32_array[1] = buffer[buffer._offset += 1];
        uint8_uint32_array[2] = buffer[buffer._offset += 1];
        uint8_uint32_array[3] = buffer[buffer._offset += 1];
        bytelength = uint32_array[0];
      }
      const value = buffer.slice(buffer._offset += 1, buffer._offset + bytelength);
      buffer._offset += bytelength - 1;
      return value;
    }
    default: {
      throw new Error(`decoder: unknown type "${type}".`);
    }
  }
};

const bytearray = { encode, decode, min_bigint, max_bigint, bigint_supported };

module.exports = bytearray;