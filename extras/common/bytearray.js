
const assert = require('./assert');

let type_index = 0;

const types = {
  boolean_false: type_index += 1,
  boolean_true: type_index += 1,
  null: type_index += 1,
  string: type_index += 1,

  array: type_index += 1,
  object: type_index += 1,

  uint_8: type_index += 1,
  uint_16: type_index += 1,
  uint_32: type_index += 1,
  uint_48: type_index += 1,

  int_8: type_index += 1,
  int_16: type_index += 1,
  int_32: type_index += 1,
  int_48: type_index += 1,

  float_32: type_index += 1,
  float_64: type_index += 1,
  positive_infinity: type_index += 1,
  negative_infinity: type_index += 1,
  nan: type_index += 1,

  buffer: type_index += 1,
};

const text_encoder = new TextEncoder();
const text_decoder = new TextDecoder();

const encode = (data) => {
  switch (typeof data) {
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
          return;
        } else {
          // double
          return;
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
          buffer[0] = key;
          buffer[1] = data >> 8;
          buffer[2] = data;
          return buffer;
        }
        if (data < 4294967296) { // 2 ** 32 = 4294967296
          const key = types.uint_32;
          const buffer = new Uint8Array(5);
          buffer[0] = key;
          buffer[1] = data >> 24;
          buffer[2] = data >> 16;
          buffer[3] = data >> 8;
          buffer[4] = data;
          return buffer;
        }
        if (data < 281474976710656) { // 2 ** 48 = 281474976710656
          const key = types.uint_48;
          const buffer = new Uint8Array(7);
          buffer[0] = key;
          buffer[1] = data >> 40;
          buffer[2] = data >> 32;
          buffer[3] = data >> 24;
          buffer[4] = data >> 16;
          buffer[5] = data >> 8;
          buffer[6] = data;
          return buffer;
        }
        throw new Error('@ uint, max positive safe integer is capped at 2^48 - 1.');
      }
      break;
    }
    case 'boolean': {
      break;
    }
    case 'object': {
      if (data === null) {
        break;
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

const pow_2_40 = Math.pow(2, 40);
const pow_2_32 = Math.pow(2, 32);
const pow_2_24 = Math.pow(2, 24);
const pow_2_16 = Math.pow(2, 16);
const pow_2_8 = Math.pow(2, 8);

const decode = (buffer) => {
  assert(buffer instanceof Uint8Array);

  if (buffer._offset === undefined) {
    buffer._offset = -1;
  }

  const type = buffer[buffer._offset += 1];

  switch (type) {
    case types.uint_8: {
      const value = buffer[buffer._offset += 1];
      return value;
    }
    case types.uint_16: {
      const value = (buffer[buffer._offset += 1] * pow_2_8) + (buffer[buffer._offset += 1]);
      return value;
    }
    case types.uint_32: {
      const value = (buffer[buffer._offset += 1] * pow_2_24)
        + (buffer[buffer._offset += 1] * pow_2_16)
        + (buffer[buffer._offset += 1] * pow_2_8)
        + (buffer[buffer._offset += 1]);
      return value;
    }
    case types.uint_48: {
      const value = (buffer[buffer._offset += 1] * pow_2_40)
        + (buffer[buffer._offset += 1] * pow_2_32)
        + (buffer[buffer._offset += 1] * pow_2_24)
        + (buffer[buffer._offset += 1] * pow_2_16)
        + (buffer[buffer._offset += 1] * pow_2_8)
        + (buffer[buffer._offset += 1]);
      return value;
    }
    case types.string: {
      const value_length = decode(buffer);
      const next_offset = buffer._offset += 1;
      const value = text_decoder.decode(buffer.slice(next_offset, next_offset + value_length));
      buffer._offset += value_length;
      return value;
    }
    default: {
      throw new Error(`Unknown type "${type}".`);
    }
  }
};

const test_cases = [
  ['zero', 0],
  ['uint8', 255],
  ['uint16', 65535],
  ['uint32', 4294967295],
  ['uint48', 281474976710655],
  ['string', 'foo'],
];

process.nextTick(async () => {
  test_cases.forEach((test_case) => {
    const [label, data] = test_case;
    let result = false;
    try {
      result = decode(encode(data), 0) === data;
    } catch (e) {
      console.error(e.message);
    }
    console.log(`${label}, ${data}: ${result}`);
  });
});
