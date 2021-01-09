
const assert = require('./assert');

function emitter () {

  /**
   * @type {Map<String, Set<Function>>}
   */
  const namespaces = new Map();

  /**
   * @param {String} name
   * @param {Function} listener
   */
  const on = (name, listener) => {
    assert(typeof name === 'string');
    assert(listener instanceof Function);
    if (namespaces.has(name) === false) {
      namespaces.set(name, new Set());
    }
    const namespace = namespaces.get(name);
    assert(namespace instanceof Set);
    namespace.add(listener);
  };

  /**
   * @param {String} name
   * @param {Function} listener
   */
  const off = (name, listener) => {
    assert(typeof name === 'string');
    assert(listener instanceof Function);
    assert(namespaces.has(name) === true);
    const namespace = namespaces.get(name);
    assert(namespace instanceof Set);
    assert(namespace.has(listener) === true);
    namespace.delete(listener);
    if (namespace.size === 0) {
      namespaces.delete(name);
    }
  };

  /**
   * @param {String} name
   * @param  {...any} args
   */
  const emit = (name, ...args) => {
    assert(typeof name === 'string');
    if (namespaces.has(name) == true) {
      const namespace = namespaces.get(name);
      namespace.forEach((listener) => {
        listener(...args);
      });
    }
  };

  this.on = on;
  this.off = off;
  this.emit = emit;
}

module.exports = emitter;