
const emitter = require('./emitter');

process.nextTick(async () => {
  const events = new emitter();
  const listener_1 = (...args) => console.log('listener_1', { args });
  const listener_2 = (...args) => console.log('listener_2', { args });

  events.on('test-event', listener_1);
  events.on('test-event', listener_2);
  events.emit('test-event', 'foo', 'bar', 123);
  events.emit('test-event', 'foo', 'bar', 456);

  events.off('test-event', listener_1);
  events.emit('test-event', 'foo', 'bar', 789);

  events.off('test-event', listener_2);
  events.emit('test-event', 'foo', 'bar', 0);
});