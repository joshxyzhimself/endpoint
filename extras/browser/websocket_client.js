
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
    client.onmessage = (message_event) => {
      events.emit('message', message_event);
    };
    client.onerror = async (error_event) => {
      console.error({ error_event });
      events.emit('error', error_event);
    };
    client.onclose = async (close_event) => {
      events.emit('disconnect', close_event); // event.code, event.reason
      if (close_event instanceof CloseEvent && close_event.code === 1000) {
        return;
      }
      await await_backoff();
      connect();
    };
  };
  const disconnect = () => {
    assert(client instanceof WebSocket);
    assert(client.readyState === 1);
    client.close(1000);
  };
  this.send = send;
  this.connect = connect;
  this.disconnect = disconnect;
  this.on = events.on.bind(events);
  this.off = events.off.bind(events);
}

module.exports = websocket_client;