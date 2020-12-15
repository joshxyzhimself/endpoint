
const emitter = require('./emitter');

process.nextTick(async () => {
  const test_emitter = new emitter();
  const listener = (...args) => console.log({ args });
  test_emitter.on('test-event', listener);
  test_emitter.emit('test-event', 'foo', 'bar', 123);
  test_emitter.emit('test-event', 'foo', 'bar', 456);
  test_emitter.off('test-event', listener);
  test_emitter.emit('test-event', 'foo', 'bar', 123);
});