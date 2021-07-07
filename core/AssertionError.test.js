
// @ts-check

const AssertionError = require('./AssertionError');

try {
  AssertionError.assert(Math.random() > 0, 'ERR_TEST_ERROR_CODE', 'Test error message.');
  AssertionError.assert(Math.random() === 0);
} catch (e) {
  console.error(e);
  console.error(JSON.stringify(e, null, 2));
}