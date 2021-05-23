
const AssertionError = require('./AssertionError');

const create_emitter = () => {
  /**
   * @type {Map<string|number, Set<Function>>}
   */
  const index = new Map();

  /**
   * @param {string|number} id
   * @param {Function} listener
   */
  const on = (id, listener) => {
    AssertionError.assert(typeof id === 'string' || typeof id === 'number');
    AssertionError.assert(listener instanceof Function);
    if (index.has(id) === false) {
      index.set(id, new Set());
    }
    const listeners = index.get(id);
    AssertionError.assert(listeners instanceof Set);
    listeners.add(listener);
  };

  /**
   * @param {string|number} id
   * @param {Function} listener
   */
  const off = (id, listener) => {
    AssertionError.assert(typeof id === 'string' || typeof id === 'number');
    AssertionError.assert(listener instanceof Function);
    AssertionError.assert(index.has(id) === true);
    const listeners = index.get(id);
    AssertionError.assert(listeners instanceof Set);
    AssertionError.assert(listeners.has(listener) === true);
    listeners.delete(listener);
    if (listeners.size === 0) {
      index.delete(id);
    }
  };

  /**
   * @param {string|number} id
   * @param  {...any} args
   */
  const emit = (id, ...args) => {
    AssertionError.assert(typeof id === 'string' || typeof id === 'number');
    if (index.has(id) == true) {
      const listeners = index.get(id);
      listeners.forEach((listener) => {
        listener(...args);
      });
    }
  };

  const emitter = { on, off, emit };
  return emitter;
};

module.exports = create_emitter;