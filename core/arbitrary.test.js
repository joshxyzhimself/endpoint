
// @ts-check

const AssertionError = require('./AssertionError');
const { fix, add, subtract, multiply, divide } = require('./arbitrary');

const tests = [
  [add('75', '25', '25'), '125'],
  [add('75', '25', '25'), '125'],
  [subtract('75', '25', '25'), '25'],
  [multiply('5', '5'), '25'],
  [add('5', multiply('5', '5')), '30'],
  [divide('125', '5', '5'), '5'],
  [divide('1000', '10', '10'), '10'],
  [divide('1000', '8.86'), '112.86681715575620767494356659142212'],
  [add(String(Number.MAX_SAFE_INTEGER), '0'), '9007199254740991'],
  [add(String(Number.MIN_SAFE_INTEGER), '0'), '-9007199254740991'],
  [subtract(String(Number.MAX_SAFE_INTEGER), '1'), '9007199254740990'],
  [multiply(String(Number.MAX_SAFE_INTEGER), '0.5'), '4503599627370495.5'],
  [divide(String(Number.MAX_SAFE_INTEGER), '2'), '4503599627370495.5'],
  [multiply(String(Math.PI), String(Math.PI)), '9.869604401089357120529513782849'],
  [divide(String(Math.PI), String(Math.PI)), '1'],
  [divide('1', '12'), '0.08333333333333333333333333333333'],
  [add('0.1', '0.2'), '0.3'],
  [multiply('1.500', '1.3'), '1.95'],
  [multiply('0', '1'), '0'],
  [multiply('0', '-1'), '0'],
  [multiply('-1', '1'), '-1'],
  [divide('1.500', '1.3'), '1.15384615384615384615384615384615'],
  [divide('0', '1'), '0'],
  [divide('0', '-1'), '0'],
  [divide('-1', '1'), '-1'],
  [multiply('5', '5', '5', '5'), '625'],
  [multiply('5', '5', '5', '123', '123', '5'), '9455625'],
  [multiply('1.1', '1.28485', '1.3347', '1.4', '1.52', '1.62'), '6.50302483601232'],
  [divide('1.1', '1.28485', '1.3347', '1.4', '1.52', '1.62'), '0.18606725800880943327544927552264'],
  [multiply('100', '20', '5'), '10000'],
  [multiply('100', multiply('20', '5')), '10000'],
  [divide('100', '20', '5'), '1'],
  [divide('100', divide('20', '5')), '25'],
  [multiply('0.100', '10'), '1'],
  [divide('1', '-45'), '-0.02222222222222222222222222222222'],
  [divide('100', '-101'), '-0.990099009900990099009900990099'],
  [divide('-0.01', '0.01'), '-1'],
  [fix(divide('100', '-101'), 2), '-0.99'],
  [fix('10000.002000', 0), '10000'],
  [fix('10000.002000', 2), '10000.00'],
  [fix('10000.002000', 4), '10000.0020'],
  [fix('10000.002000', 8), '10000.00200000'],
];


tests.forEach((test, test_index) => {
  AssertionError.assert(test instanceof Array);
  const [value, expected] = test;
  AssertionError.assert(typeof value === 'string');
  AssertionError.assert(typeof expected === 'string');
  AssertionError.assert(value === expected, `# ${test_index}, FAIL: "${value}" !== "${expected}"`);
  console.log(`# ${test_index}, PASS: "${value}" === "${expected}"`);
});