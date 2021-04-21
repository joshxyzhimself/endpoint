
const AssertionError = require('../core/AssertionError');
const create_emitter = require('../core/create_emitter');

const create_localstorage_client = () => {
  const emitter = create_emitter();
  window.onstorage = (event) => {
    const key = event.key;
    const new_value = event.newValue;
    if (typeof new_value === 'string') {
      try {
        const value = JSON.parse(new_value);
        emitter.emit(key, value);
        emitter.emit('update', key, value);
        return;
      } catch (e) {
        emitter.emit('error', e);
        return;
      }
    }
    emitter.emit(key, null);
    emitter.emit('update', key, null);
  };
  const set = (key, value) => {
    AssertionError.assert(typeof key === 'string');
    const encoded_value = JSON.stringify(value);
    localStorage.setItem(key, encoded_value);
  };
  const get = (key) => {
    AssertionError.assert(typeof key === 'string');
    const encoded_value = localStorage.getItem(key);
    if (typeof encoded_value === 'string') {
      const value = JSON.parse(encoded_value);
      return value;
    }
    return null;
  };
  const remove = (key) => {
    AssertionError.assert(typeof key === 'string');
    localStorage.removeItem(key);
  };
  const localstorage_client = {
    get,
    set,
    remove,
    on: emitter.on,
    off: emitter.off,
  };
  return localstorage_client;
};

module.exports = create_localstorage_client;