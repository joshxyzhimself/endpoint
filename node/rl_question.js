const assert = require('assert');
const readline = require('readline');

const readline_interface = readline.createInterface({ input: process.stdin, output: process.stdout });

/**
 * @param {string} query
 * @returns {string}
 */
const rl_question = (query) => new Promise((resolve, reject) => {
  try {
    assert(typeof query === 'string');
    readline_interface.question(query.concat('\n'), resolve);
  } catch (e) {
    reject(e);
  }
});

module.exports = rl_question;