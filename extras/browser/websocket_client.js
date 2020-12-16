
const assert = require('../common/assert');
const emitter = require('../common/emitter');

function websocket_client() {
  let client;
  let backoff = 125;
  const events = new emitter();
  const await_backoff = async () => {
    backoff *= 2;
    if (backoff > 4000) {
      backoff = 125;
    }
    await new Promise((resolve) => setTimeout(resolve, backoff));
  };
  const send = (data) => {
    assert(data instanceof Object);
    const raw_data = JSON.stringify(data);
    assert(client instanceof WebSocket);
    assert(client.readyState === 1);
    client.send(raw_data);
  };
  const connect = () => {
    const websocket_protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const websocket_host = window.location.host;
    client = new WebSocket(`${websocket_protocol}//${websocket_host}/`);
    client.onopen = () => {
      if (client.readyState === 1) {
        events.emit('connect');
      }
    };
    client.onmessage = (event) => {
      assert(typeof event.data === 'string');
      const message = JSON.parse(event.data);
      events.emit('message', message);
    };
    client.onerror = async (event) => {
      console.error({ event });
      events.emit('error', event);
    };
    client.onclose = async (event) => {
      events.emit('disconnect', event.code, event.reason); // event.code, event.reason
      if (event.code === 1000) {
        return;
      }
      await await_backoff();
      connect();
    };
  };
  const disconnect = () => {
    assert(client instanceof WebSocket);
    client.close(1000);
  };
  this.send = send;
  this.connect = connect;
  this.disconnect = disconnect;
  this.on = events.on.bind(events);
  this.off = events.off.bind(events);
}

module.exports = websocket_client;