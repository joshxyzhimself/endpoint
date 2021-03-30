
const AssertionError = require('./AssertionError');
const queue = require('./queue');

let index_counter = 0;

const q = queue(1, async (index) => {
  AssertionError.assert(typeof index === 'number');
  AssertionError.assert(Number.isInteger(index) === true);
  try {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const response = null;
    console.log(`queue :: index ${index} :: response ${response}`);
    index_counter += 1;
    q.push(index_counter);
  } catch (e) {
    console.error(`queue :: index ${index} :: error ${e.message}`);
    q.push(index);
  }
  console.log({ values: q.values });
});

q.pause();
for (let i = 1, l = 10; i <= l; i += 1) {
  index_counter += 1;
  q.push(index_counter);
}

process.nextTick(() => q.resume());