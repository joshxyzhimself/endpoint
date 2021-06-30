
// @ts-check

const AssertionError = require('./AssertionError');

/**
 * @type {import('./create_emitter').create_emitter}
 */
const create_emitter = () => {

  /**
   * @type {import('./create_emitter').index}
   */
  const index = new Map();

  /**
   * @type {import('./create_emitter').on}
   */
  const on = (id, listener) => {
    AssertionError.assert(typeof id === 'string' || typeof id === 'number', 'ERR_EMITTER_INVALID_EVENT_ID', 'Invalid event id.');
    AssertionError.assert(listener instanceof Function, 'ERR_EMITTER_INVALID_EVENT_LISTENER', 'Invalid event listener.');
    if (index.has(id) === false) {
      index.set(id, new Set());
    }
    const listeners = index.get(id);
    if (listeners.has(listener) === false) {
      listeners.add(listener);
    }
  };

  /**
   * @type {import('./create_emitter').off}
   */
  const off = (id, listener) => {
    AssertionError.assert(typeof id === 'string' || typeof id === 'number', 'ERR_EMITTER_INVALID_EVENT_ID', 'Invalid event id.');
    AssertionError.assert(listener instanceof Function, 'ERR_EMITTER_INVALID_EVENT_LISTENER', 'Invalid event listener.');
    AssertionError.assert(index.has(id) === true, 'ERR_EMITTER_INVALID_EVENT_ID', 'Invalid event id.');
    const listeners = index.get(id);
    if (listeners.has(listener) === true) {
      listeners.delete(listener);
    }
    if (listeners.size === 0) {
      index.delete(id);
    }
  };

  /**
   * @type {import('./create_emitter').emit}
   */
  const emit = (id, ...args) => {
    AssertionError.assert(typeof id === 'string' || typeof id === 'number', 'ERR_EMITTER_INVALID_EVENT_ID', 'Invalid event id.');
    if (index.has(id) == true) {
      const listeners = index.get(id);
      listeners.forEach((listener) => {
        listener(...args);
      });
    }
  };

  /**
   * @type {import('./create_emitter').emitter}
   */
  const emitter = { on, off, emit };
  return emitter;
};

module.exports = create_emitter;