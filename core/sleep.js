
const AssertionError = require('./AssertionError');

const sleep = async (timeout) => {
  AssertionError.assert(typeof timeout === 'number');
  await new Promise((resolve) => setTimeout(resolve, timeout));
};

module.exports = sleep;