
const create_emitter = require('./create_emitter');

process.nextTick(async () => {
  const emitter = create_emitter();
  const listener_1 = (...args) => console.log('listener_1', { args });
  const listener_2 = (...args) => console.log('listener_2', { args });

  emitter.on('test-event', listener_1);
  emitter.on('test-event', listener_2);
  emitter.emit('test-event', 'should be emitted by listener_1 & listener_2');

  emitter.off('test-event', listener_1);
  emitter.emit('test-event', 'should be emitted by listener_2');

  emitter.off('test-event', listener_2);
  emitter.emit('test-event', 'should be emitted by none');
});