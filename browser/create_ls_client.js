
// @ts-check

const assert = require('../core/assert');
const create_emitter = require('../core/create_emitter');

const event_types = {
  UPDATE: 'update',
  ERROR: 'error',
};

const errors = {
  INVALID_KEY: {
    code: 'ERR_LOCALSTORAGE_INVALID_KEY',
    message: 'Invalid key.',
  },
};

const create_ls_client = () => {
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
    assert(typeof key === 'string', errors.INVALID_KEY.code, errors.INVALID_KEY.message);
    const encoded_value = JSON.stringify(value);
    localStorage.setItem(key, encoded_value);
  };
  const get = (key) => {
    assert(typeof key === 'string', errors.INVALID_KEY.code, errors.INVALID_KEY.message);
    const encoded_value = localStorage.getItem(key);
    if (typeof encoded_value === 'string') {
      const value = JSON.parse(encoded_value);
      return value;
    }
    return null;
  };
  const remove = (key) => {
    assert(typeof key === 'string', errors.INVALID_KEY.code, errors.INVALID_KEY.message);
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

module.exports = create_ls_client;