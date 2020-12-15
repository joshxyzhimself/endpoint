
const assert = require('./assert');

function emitter () {

  /**
   * @type {Map<String, Set<Function>>}
   */
  const listener_sets = new Map();

  /**
   * @param {String} name
   * @param {Function} listener
   */
  this.on = (name, listener) => {
    assert(typeof name === 'string');
    assert(listener instanceof Function);
    if (listener_sets.has(name) === false) {
      listener_sets.set(name, new Set());
    }
    const listener_set = listener_sets.get(name);
    assert(listener_set instanceof Set);
    listener_set.add(listener);
  };

  /**
   * @param {String} name
   * @param {Function} listener
   */
  this.off = (name, listener) => {
    assert(typeof name === 'string');
    assert(listener instanceof Function);
    assert(listener_sets.has(name) === true);
    const listener_set = listener_sets.get(name);
    assert(listener_set instanceof Set);
    assert(listener_set.has(listener) === true);
    listener_set.delete(listener);
  };

  /**
   * @param {String} name
   * @param  {...any} args
   */
  this.emit = (name, ...args) => {
    assert(typeof name === 'string');
    if (listener_sets.has(name) == true) {
      const listener_set = listener_sets.get(name);
      listener_set.forEach((listener) => {
        listener(...args);
      });
    }
  };
}

module.exports = emitter;