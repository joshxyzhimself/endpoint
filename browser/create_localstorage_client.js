
const AssertionError = require('../core/AssertionError');
const create_emitter = require('../core/create_emitter');

const event_types = {
  UPDATE: 'update',
  ERROR: 'error',
};

const create_localstorage_client = () => {
  const emitter = create_emitter();
  window.onstorage = (event) => {
    const key = event.key;
    const new_value = event.newValue;
    if (typeof new_value === 'string') {
      try {
        const value = JSON.parse(new_value);
        emitter.emit(key, value);
        emitter.emit(event_types.UPDATE, key, value);
        return;
      } catch (e) {
        emitter.emit(event_types.ERROR, e);
        return;
      }
    }
    emitter.emit(key, null);
    emitter.emit(event_types.UPDATE, key, null);
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
    event_types,
  };
  return localstorage_client;
};

module.exports = create_localstorage_client;