
const create_emitter = require('./create_emitter');

process.nextTick(async () => {
  const emitter = create_emitter();
  const listener_1 = (...args) => console.log('listener_1', { args });
  const listener_2 = (...args) => console.log('listener_2', { args });

  emitter.on('test-event', listener_1);
  emitter.on('test-event', listener_2);
  emitter.emit('test-event', 'foo1', 'bar1', 123);
  emitter.emit('test-event', 'foo2', 'bar2', 456);

  emitter.off('test-event', listener_1);
  emitter.emit('test-event', 'foo3', 'bar3', 789);

  emitter.off('test-event', listener_2);
  emitter.emit('test-event', 'foo4', 'bar4', 0);
});