
// @ts-check

const AssertionError = require('./AssertionError');

const errors = {
  INVALID_TIMEOUT: {
    code: 'ERR_SLEEP_INVALID_TIMEOUT',
    message: 'Invalid timeout.',
  },
};

const sleep = async (timeout) => {
  AssertionError.assert(typeof timeout === 'number', errors.INVALID_TIMEOUT.code, errors.INVALID_TIMEOUT.message);
  await new Promise((resolve) => setTimeout(resolve, timeout));
};

module.exports = sleep;