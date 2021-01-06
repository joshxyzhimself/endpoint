
const assert = require('./assert');

let type_index = 0;

const types = {
  boolean_false: type_index += 1,
  boolean_true: type_index += 1,
  null: type_index += 1,
  string: type_index += 1,

  uint_8: type_index += 1,
  uint_16: type_index += 1,
  uint_32: type_index += 1,
  uint_53: type_index += 1,

  int_8: type_index += 1,
  int_16: type_index += 1,
  int_32: type_index += 1,
  int_48: type_index += 1,

  float_32: type_index += 1,
  float_64: type_index += 1,

  uint8array: type_index += 1,
  array: type_index += 1,
  object: type_index += 1,
  set: type_index += 1,
  map: type_index += 1,

  positive_infinity: type_index += 1,
  negative_infinity: type_index += 1,
  nan: type_index += 1,
};

const text_encoder = new TextEncoder();
const text_decoder = new TextDecoder();

const uint16_array = new Uint16Array(1);
const uint8_uint16_array = new Uint8Array(uint16_array.buffer);

const uint32_array = new Uint32Array(1);
const uint8_uint32_array = new Uint8Array(uint32_array.buffer);

const biguint64_array = new BigUint64Array(1);
const uint8_biguint64_array = new Uint8Array(biguint64_array.buffer);

const float32_array = new Float32Array(1);
const uint8_float32_array = new Uint8Array(float32_array.buffer);

const float64_array = new Float64Array(1);
const uint8_float64_array = new Uint8Array(float64_array.buffer);

const encode = (data) => {
  switch (typeof data) {
    case 'boolean': {
      const buffer = new Uint8Array(1);
      const key = data === true ? types.boolean_true : types.boolean_false;
      buffer[0] = key;
      return buffer;
    }
    case 'string': {
      const key = types.string;
      const value_buffer = text_encoder.encode(data);
      const value_length_buffer = encode(value_buffer.byteLength);
      const buffer = new Uint8Array(1 + value_length_buffer.byteLength + value_buffer.byteLength);
      buffer[0] = key;
      buffer.set(value_length_buffer, 1);
      buffer.set(value_buffer, 1 + value_length_buffer.byteLength);
      return buffer;
    }
    case 'number': {
      if (Number.isNaN(data) === true) {
        // nan
        return;
      }
      if (Number.isFinite(data) === false) {
        if (data === Infinity) {
          // +infinity
          return;
        }
        if (data === -Infinity) {
          // -infinity
          return;
        }
      }
      if (Math.floor(data) !== data) {
        if (Math.fround(data) === data) {
          // float
          const key = types.float_32;
          const buffer = new Uint8Array(5);
          float32_array[0] = data;
          buffer[0] = key;
          buffer[1] = uint8_float32_array[0];
          buffer[2] = uint8_float32_array[1];
          buffer[3] = uint8_float32_array[2];
          buffer[4] = uint8_float32_array[3];
          return buffer;
        } else {
          // double
          const key = types.float_64;
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
      if (data >= 0) {
        if (data < 256) { // 2 ** 8 = 256
          const key = types.uint_8;
          const buffer = new Uint8Array(2);
          buffer[0] = key;
          buffer[1] = data;
          return buffer;
        }
        if (data < 65536) { // 2 ** 16 = 65536
          const key = types.uint_16;
          const buffer = new Uint8Array(3);
          uint16_array[0] = data;
          buffer[0] = key;
          buffer[1] = uint8_uint16_array[0];
          buffer[2] = uint8_uint16_array[1];
          return buffer;
        }
        if (data < 4294967296) { // 2 ** 32 = 4294967296
          const key = types.uint_32;
          const buffer = new Uint8Array(5);
          uint32_array[0] = data;
          buffer[0] = key;
          buffer[1] = uint8_uint32_array[0];
          buffer[2] = uint8_uint32_array[1];
          buffer[3] = uint8_uint32_array[2];
          buffer[4] = uint8_uint32_array[3];
          return buffer;
        }
        if (data <= Number.MAX_SAFE_INTEGER) { // 2 ** 53 - 1
          const key = types.uint_53;
          const buffer = new Uint8Array(9);
          biguint64_array[0] = BigInt(data);
          buffer[0] = key;
          buffer[1] = uint8_biguint64_array[0];
          buffer[2] = uint8_biguint64_array[1];
          buffer[3] = uint8_biguint64_array[2];
          buffer[4] = uint8_biguint64_array[3];
          buffer[5] = uint8_biguint64_array[4];
          buffer[6] = uint8_biguint64_array[5];
          buffer[7] = uint8_biguint64_array[6];
          buffer[8] = uint8_biguint64_array[7];
          return buffer;
        }
        console.log(data, Number.MAX_SAFE_INTEGER);
        throw new Error('encoder: uint max positive safe integer is capped at 2^53 - 1.');
      }
      break;
    }
    case 'object': {
      if (data === null) {
        const buffer = new Uint8Array(1);
        const key = types.null;
        buffer[0] = key;
        return buffer;
      }
      if (data instanceof Array) {
        break;
      }
      if (data instanceof Object) {
        break;
      }
      break;
    }
    default: {
      break;
    }
  }
};

const decode = (buffer) => {
  assert(buffer instanceof Uint8Array);

  if (buffer._offset === undefined) {
    buffer._offset = -1;
  }

  const type = buffer[buffer._offset += 1];

  switch (type) {
    case types.boolean_false: {
      return false;
    }
    case types.boolean_true: {
      return true;
    }
    case types.null: {
      return null;
    }
    case types.string: {
      const value_length = decode(buffer);
      const next_offset = buffer._offset += 1;
      const value = text_decoder.decode(buffer.slice(next_offset, next_offset + value_length));
      buffer._offset += value_length;
      return value;
    }
    case types.uint_8: {
      const value = buffer[buffer._offset += 1];
      return value;
    }
    case types.uint_16: {
      uint8_uint16_array[0] = buffer[buffer._offset += 1];
      uint8_uint16_array[1] = buffer[buffer._offset += 1];
      const value = uint16_array[0];
      return value;
    }
    case types.uint_32: {
      uint8_uint32_array[0] = buffer[buffer._offset += 1];
      uint8_uint32_array[1] = buffer[buffer._offset += 1];
      uint8_uint32_array[2] = buffer[buffer._offset += 1];
      uint8_uint32_array[3] = buffer[buffer._offset += 1];
      const value = uint32_array[0];
      return value;
    }
    case types.uint_53: {
      uint8_biguint64_array[0] = buffer[buffer._offset += 1];
      uint8_biguint64_array[1] = buffer[buffer._offset += 1];
      uint8_biguint64_array[2] = buffer[buffer._offset += 1];
      uint8_biguint64_array[3] = buffer[buffer._offset += 1];
      uint8_biguint64_array[4] = buffer[buffer._offset += 1];
      uint8_biguint64_array[5] = buffer[buffer._offset += 1];
      uint8_biguint64_array[6] = buffer[buffer._offset += 1];
      uint8_biguint64_array[7] = buffer[buffer._offset += 1];
      const value = Number(biguint64_array[0]);
      return value;
    }
    case types.float_32: {
      uint8_float32_array[0] = buffer[buffer._offset += 1];
      uint8_float32_array[1] = buffer[buffer._offset += 1];
      uint8_float32_array[2] = buffer[buffer._offset += 1];
      uint8_float32_array[3] = buffer[buffer._offset += 1];
      const value = float32_array[0];
      return value;
    }
    case types.float_64: {
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
    default: {
      throw new Error(`decoder: unknown type "${type}".`);
    }
  }
};

const test_cases = [
  ['boolean_true', true],
  ['boolean_false', false],
  ['null', null],
  ['zero', 0],
  ['uint_8', Math.pow(2, 8) - 1],
  ['uint_16', Math.pow(2, 16) - 1],
  ['uint_32', Math.pow(2, 32) - 1],
  ['uint_53', Math.pow(2, 53) - 1],
  ['float_32', 1.5],
  ['float_64', 1.51],
  ['string', 'foo'],
];

process.nextTick(async () => {
  test_cases.forEach((test_case) => {
    const [label, data] = test_case;
    let result = false;
    let encoded = null;
    let decoded = null;
    let error = null;
    try {
      encoded = encode(data);
      decoded = decode(encoded);
      result = decoded === data;
    } catch (e) {
      error = e;
    }
    if (result === false) {
      console.log({ encoded, decoded, error: error });
    }
    console.log(`${label}, ${data}: ${result === true ? 'OK' : 'FAIL'}`);
  });
});
