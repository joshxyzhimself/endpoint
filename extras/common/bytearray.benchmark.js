
const Benchmark = require('benchmark');
const suite = new Benchmark.Suite;

const bytearray = require('./bytearray');

const test_data = { foo: 1, bar: 'abc' };

const test_data_2 = {
  foo: 'bar',
  test_object: { test_bool: true },
  test_array: [true, false, null, 1, 1.5, Math.pow(2, 32) - 1],
  test_nested: {
    foo: 'bar',
    test_object: { test_bool: true },
    test_array: [true, false, null, 1, 1.5, Math.pow(2, 32) - 1],
  },
};

suite
  .add('JSON stringify', () => {
    JSON.stringify(test_data);
  })
  .add('bytearray encode', () => {
    bytearray.encode(test_data);
  })
  .add('JSON stringify test_data_2', () => {
    JSON.stringify(test_data_2);
  })
  .add('bytearray encode test_data_2', () => {
    bytearray.encode(test_data_2);
  })
  .add('JSON stringify parse', () => {
    const test_data_json_encoded = JSON.stringify(test_data);
    JSON.parse(test_data_json_encoded);
  })
  .add('bytearray encode decode', () => {
    const test_data_encoded = bytearray.encode(test_data);
    bytearray.decode(test_data_encoded);
  })
  .on('cycle', (event) => {
    console.log(String(event.target));
  })
  .run({ 'async': true });