
const AssertionError = require('./AssertionError');

const create_emitter = () => {
  /**
   * @type {Map<string|number, Set<Function>>}
   */
  const events = new Map();

  /**
   * @param {string|number} event_id
   * @param {Function} event_listener
   */
  const on = (event_id, event_listener) => {
    AssertionError.assert(typeof event_id === 'string' || typeof event_id === 'number');
    AssertionError.assert(event_listener instanceof Function);
    if (events.has(event_id) === false) {
      events.set(event_id, new Set());
    }
    const event_listeners = events.get(event_id);
    AssertionError.assert(event_listeners instanceof Set);
    event_listeners.add(event_listener);
  };

  /**
   * @param {string|number} event_id
   * @param {Function} event_listener
   */
  const off = (event_id, event_listener) => {
    AssertionError.assert(typeof event_id === 'string' || typeof event_id === 'number');
    AssertionError.assert(event_listener instanceof Function);
    AssertionError.assert(events.has(event_id) === true);
    const event_listeners = events.get(event_id);
    AssertionError.assert(event_listeners instanceof Set);
    AssertionError.assert(event_listeners.has(event_listener) === true);
    event_listeners.delete(event_listener);
    if (event_listeners.size === 0) {
      events.delete(event_id);
    }
  };

  /**
   * @param {string|number} event_id
   * @param  {...any} args
   */
  const emit = (event_id, ...args) => {
    AssertionError.assert(typeof event_id === 'string' || typeof event_id === 'number');
    if (events.has(event_id) == true) {
      const event_listeners = events.get(event_id);
      event_listeners.forEach((event_listener) => {
        event_listener(...args);
      });
    }
  };

  const emitter = { on, off, emit };
  return emitter;
};

module.exports = create_emitter;