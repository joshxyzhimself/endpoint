const bytearray = require('./bytearray');

const test_cases = [
  ['boolean_true', true],
  ['boolean_false', false],
  ['null', null],
  ['zero', 0],

  ['uint_8', Math.pow(2, 8) - 1],
  ['uint_16', Math.pow(2, 16) - 1],
  ['uint_32', Math.pow(2, 32) - 1],
  ['uint_53', Math.pow(2, 53) - 1],

  ['negative_uint8_type', (Math.pow(2, 8) - 1) * -1],
  ['negative_uint16_type', (Math.pow(2, 16) - 1) * -1],
  ['negative_uint32_type', (Math.pow(2, 32) - 1) * -1],
  ['negative_uint53_type', (Math.pow(2, 53) - 1) * -1],

  ['float_32', 1.5],
  ['float_64', 1.51],
  ['bigint', bytearray.max_bigint],
  ['bigint', bytearray.min_bigint],

  ['string', 'foo'],
  ['string', ''],
  ['array', ['foo', 'bar']],
  ['object', { foo: 'bar' }],
  ['uint8array', new Uint8Array(3).fill(255)],
  ['nested object', {
    foo: 'bar',
    test_object: { test_bool: true },
    test_array: [true, false, null, 1, 1.5, Math.pow(2, 32) - 1],
    test_uint8array: new Uint8Array(3).fill(255),
    test_nested: {
      foo: 'bar',
      test_object: { test_bool: true },
      test_array: [true, false, null, 1, 1.5, Math.pow(2, 32) - 1],
      test_uint8array: new Uint8Array(3).fill(255),
    },
  }],
  ['fixint', 1],
  ['fixint array', [1, 2, 3, 4, 5]],
  ['fixint array', new Array(Math.pow(2, 4) - 1).fill(0)],
];

process.nextTick(async () => {
  test_cases.forEach((test_case) => {
    const [label, data] = test_case;
    let encoded = null;
    let decoded = null;
    let error = null;
    try {
      encoded = bytearray.encode(data);
      decoded = bytearray.decode(encoded);
    } catch (e) {
      error = e;
    }
    switch (typeof data) {
      case 'object': {
        if (JSON.stringify(data) === JSON.stringify(decoded)) {
          console.log({ label, data });
        } else {
          console.log({ label, data, encoded, decoded, error: error });
        }
        break;
      }
      default: {
        if (decoded === data) {
          console.log({ label, data });
        } else {
          console.log({ label, data, encoded, decoded, error: error });
        }
        break;
      }
    }
  });
});
