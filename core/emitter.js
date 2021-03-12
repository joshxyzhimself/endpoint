
const AssertionError = require('./AssertionError');

function emitter () {

  /**
   * @type {Map<String, Set<Function>>}
   */
  const namespaces = new Map();

  /**
   * @param {String} event_name
   * @param {Function} event_listener
   */
  const on = (event_name, event_listener) => {
    AssertionError.assert(typeof event_name === 'string');
    AssertionError.assert(event_listener instanceof Function);
    if (namespaces.has(event_name) === false) {
      namespaces.set(event_name, new Set());
    }
    const namespace = namespaces.get(event_name);
    AssertionError.assert(namespace instanceof Set);
    namespace.add(event_listener);
  };

  /**
   * @param {String} event_name
   * @param {Function} event_listener
   */
  const off = (event_name, event_listener) => {
    AssertionError.assert(typeof event_name === 'string');
    AssertionError.assert(event_listener instanceof Function);
    AssertionError.assert(namespaces.has(event_name) === true);
    const namespace = namespaces.get(event_name);
    AssertionError.assert(namespace instanceof Set);
    AssertionError.assert(namespace.has(event_listener) === true);
    namespace.delete(event_listener);
    if (namespace.size === 0) {
      namespaces.delete(event_name);
    }
  };

  /**
   * @param {String} event_name
   * @param  {...any} args
   */
  const emit = (event_name, ...args) => {
    AssertionError.assert(typeof event_name === 'string');
    if (namespaces.has(event_name) == true) {
      const namespace = namespaces.get(event_name);
      namespace.forEach((event_listener) => {
        event_listener(...args);
      });
    }
  };

  this.on = on;
  this.off = off;
  this.emit = emit;
}

module.exports = emitter;