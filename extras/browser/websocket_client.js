
const assert = require('../common/assert');
const emitter = require('../common/emitter');

const errors = {
  ERR_INVALID_PARAMETER_TYPE: 'ERR_INVALID_PARAMETER_TYPE',
  ERR_WEBSOCKET_DISCONNECTED: 'ERR_WEBSOCKET_DISCONNECTED',
};

function websocket_client () {
  let client = null;
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
    assert(data instanceof Object, errors.ERR_INVALID_PARAMETER_TYPE);
    assert(client instanceof WebSocket, errors.ERR_WEBSOCKET_DISCONNECTED);
    assert(client.readyState === 1, errors.ERR_WEBSOCKET_DISCONNECTED);
    const raw_data = JSON.stringify(data);
    client.send(raw_data);
  };
  const connect = () => {
    events.emit('connecting');
    const websocket_protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const websocket_host = window.location.host;
    client = new WebSocket(`${websocket_protocol}//${websocket_host}/`);
    client.onopen = () => {
      if (client.readyState === 1) {
        events.emit('connect');
      }
    };
    client.onmessage = (event) => {
      assert(typeof event.data === 'string', errors.ERR_INVALID_PARAMETER_TYPE);
      const message = JSON.parse(event.data);
      events.emit('message', message);
    };
    client.onerror = async (event) => {
      events.emit('error', event);
    };
    client.onclose = async (event) => {
      events.emit('disconnect', event.code, event.reason);
      client = null;
      if (event.code === 1000) {
        return;
      }
      await await_backoff();
      connect();
    };
  };
  const disconnect = () => {
    if (client instanceof WebSocket) {
      if (client.readyState === 1) {
        client.close(1000);
      }
    }
  };
  const state = () => {
    if (client instanceof WebSocket) {
      return client.readyState;
    }
    return null;
  };
  this.send = send;
  this.connect = connect;
  this.disconnect = disconnect;
  this.state = state;
  this.on = events.on.bind(events);
  this.off = events.off.bind(events);
}

module.exports = websocket_client;