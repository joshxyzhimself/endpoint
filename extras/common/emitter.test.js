
const emitter = require('./emitter');

process.nextTick(async () => {
  const test_emitter = new emitter();
  const listener_1 = (...args) => console.log('listener_1', { args });
  const listener_2 = (...args) => console.log('listener_2', { args });
  test_emitter.on('test-event', listener_1);
  test_emitter.on('test-event', listener_2);
  test_emitter.emit('test-event', 'foo', 'bar', 123);
  test_emitter.emit('test-event', 'foo', 'bar', 456);
  test_emitter.off('test-event', listener_1);
  test_emitter.emit('test-event', 'foo', 'bar', 789);
  test_emitter.off('test-event', listener_2);
  test_emitter.emit('test-event', 'foo', 'bar', 0);
});