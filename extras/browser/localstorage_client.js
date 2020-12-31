
const assert = require('../common/assert');
const emitter = require('../common/emitter');

function localstorage_client() {
  const events = new emitter();
  window.onstorage = (event) => {
    if (event.key === 'broadcast') {
      const encoded_message = event.newValue;
      const message = JSON.parse(encoded_message);
      events.emit('broadcast', message);
    }
  };
  const broadcast = (message) => {
    assert(message instanceof Object);
    const encoded_message = JSON.stringify(message);
    localStorage.setItem('broadcast', encoded_message);
  };
  const set = (key, value) => {
    assert(typeof key === 'string');
    const encoded_value = JSON.stringify(value);
    localStorage.setItem(key, encoded_value);
  };
  const get = (key) => {
    assert(typeof key === 'string');
    const encoded_value = localStorage.getItem(key);
    if (typeof encoded_value === 'string') {
      const value = JSON.parse(encoded_value);
      return value;
    }
    return null;
  };
  const remove = (key) => {
    assert(typeof key === 'string');
    localStorage.removeItem(key);
  };
  this.broadcast = broadcast;
  this.on = events.on.bind(events);
  this.off = events.off.bind(events);
  this.set = set;
  this.get = get;
  this.remove = remove;
}

module.exports = localstorage_client;