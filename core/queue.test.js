
const AssertionError = require('./AssertionError');
const queue = require('./queue');

const values = [100, 200, 300, 400, 500];

const q = queue(2, async (value) => {
  AssertionError.assert(typeof value === 'number');
  if (value === 500) {
    throw new Error('Error on 500.');
  }
  await new Promise((resolve) => setTimeout(resolve, value));
  return value;
});

q.events.on('resume', (...args) => console.log('resume', ...args));
q.events.on('result', (...args) => console.log('result', ...args));
q.events.on('error', (...args) => console.log('error', ...args));
q.events.on('drain', (...args) => console.log('drain', ...args));

values.forEach(q.push);