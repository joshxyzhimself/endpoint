
const AssertionError = require('../core/AssertionError');
const emitter = require('../core/emitter');

function localstorage_client () {
  const events = new emitter();
  window.onstorage = (event) => {
    const key = event.key;
    const new_value = event.newValue;
    if (typeof new_value === 'string') {
      try {
        const value = JSON.parse(new_value);
        events.emit(key, value);
        events.emit('update', key, value);
        return;
      } catch (e) {
        events.emit('error', e);
        return;
      }
    }
    events.emit(key, null);
    events.emit('update', key, null);
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
  this.on = events.on.bind(events);
  this.off = events.off.bind(events);
  this.set = set;
  this.get = get;
  this.remove = remove;
}

module.exports = localstorage_client;