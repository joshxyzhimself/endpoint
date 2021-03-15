
const emitter = require('./emitter');

process.nextTick(async () => {
  const events = new emitter();
  const listener_1 = (...args) => console.log('listener_1', { args });
  const listener_2 = (...args) => console.log('listener_2', { args });

  events.on('test-event', listener_1);
  events.on('test-event', listener_2);
  events.emit('test-event', 'foo1', 'bar1', 123);
  events.emit('test-event', 'foo2', 'bar2', 456);

  events.off('test-event', listener_1);
  events.emit('test-event', 'foo3', 'bar3', 789);

  events.off('test-event', listener_2);
  events.emit('test-event', 'foo4', 'bar4', 0);
});