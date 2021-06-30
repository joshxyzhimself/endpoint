
// @ts-check

const AssertionError = require('./AssertionError');

try {
  AssertionError.assert(Math.random() === 0, 'ERR_TEST_ERROR_CODE', 'Test error message.');
} catch (e) {
  console.error(JSON.stringify(e, null, 2));
}