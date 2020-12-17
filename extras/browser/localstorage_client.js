
const assert = require('../common/assert');
const emitter = require('../common/emitter');

function localstorage_client() {
  const events = new emitter();
  window.onstorage = (event) => {
    if (event.key === 'message') {
      const raw_message = event.newValue;
      const message = JSON.parse(raw_message);
      events.emit('message', message);
    }
  };
  const send = (message) => {
    assert(message instanceof Object);
    const raw_message = JSON.stringify(message);
    localStorage.setItem('message', raw_message);
  };
  this.send = send;
  this.on = events.on.bind(events);
  this.off = events.off.bind(events);
}

module.exports = localstorage_client;