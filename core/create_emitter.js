
const AssertionError = require('./AssertionError');

const create_emitter = () => {
  /**
   * @type {Map<String, Set<Function>>}
   */
  const events = new Map();

  /**
   * @param {String} event_name
   * @param {Function} event_listener
   */
  const on = (event_name, event_listener) => {
    AssertionError.assert(typeof event_name === 'string');
    AssertionError.assert(event_listener instanceof Function);
    if (events.has(event_name) === false) {
      events.set(event_name, new Set());
    }
    const event_listeners = events.get(event_name);
    AssertionError.assert(event_listeners instanceof Set);
    event_listeners.add(event_listener);
  };

  /**
   * @param {String} event_name
   * @param {Function} event_listener
   */
  const off = (event_name, event_listener) => {
    AssertionError.assert(typeof event_name === 'string');
    AssertionError.assert(event_listener instanceof Function);
    AssertionError.assert(events.has(event_name) === true);
    const event_listeners = events.get(event_name);
    AssertionError.assert(event_listeners instanceof Set);
    AssertionError.assert(event_listeners.has(event_listener) === true);
    event_listeners.delete(event_listener);
    if (event_listeners.size === 0) {
      events.delete(event_name);
    }
  };

  /**
   * @param {String} event_name
   * @param  {...any} args
   */
  const emit = (event_name, ...args) => {
    AssertionError.assert(typeof event_name === 'string');
    if (events.has(event_name) == true) {
      const event_listeners = events.get(event_name);
      event_listeners.forEach((event_listener) => {
        event_listener(...args);
      });
    }
  };

  const emitter = { on, off, emit };
  return emitter;
};

module.exports = create_emitter;