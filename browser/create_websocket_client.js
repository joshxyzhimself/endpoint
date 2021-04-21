const AssertionError = require('./AssertionError');
const create_emitter = require('../core/create_emitter');

const error_types = {
  ERR_INVALID_PARAMETER_TYPE: 'ERR_INVALID_PARAMETER_TYPE',
  ERR_WEBSOCKET_DISCONNECTED: 'ERR_WEBSOCKET_DISCONNECTED',
};

const state_types = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
};

/**
 *
 * @param {string} url
 */
const create_websocket_client = (url) => {
  AssertionError.assert(typeof url === 'string', error_types.ERR_INVALID_PARAMETER_TYPE);
  let client = null;
  let backoff = 125;
  const emitter = create_emitter();
  const await_backoff = async () => {
    backoff *= 2;
    if (backoff > 4000) {
      backoff = 125;
    }
    await new Promise((resolve) => setTimeout(resolve, backoff));
  };
  /**
   * @param {object} data
   */
  const send = (data) => {
    AssertionError.assert(data instanceof Object, error_types.ERR_INVALID_PARAMETER_TYPE);
    AssertionError.assert(client instanceof WebSocket, error_types.ERR_WEBSOCKET_DISCONNECTED);
    AssertionError.assert(client.readyState === 1, error_types.ERR_WEBSOCKET_DISCONNECTED);
    const data2 = JSON.stringify(data);
    client.send(data2);
  };

  /**
   * @param {ArrayBuffer} data
   */
  const send_arraybuffer = (data) => {
    AssertionError.assert(data instanceof ArrayBuffer, error_types.ERR_INVALID_PARAMETER_TYPE);
    AssertionError.assert(client instanceof WebSocket, error_types.ERR_WEBSOCKET_DISCONNECTED);
    AssertionError.assert(client.readyState === 1, error_types.ERR_WEBSOCKET_DISCONNECTED);
    client.send(data);
  };
  const connect = () => {
    emitter.emit('connecting');
    client = new WebSocket(url);
    client.onopen = () => {
      if (client.readyState === 1) {
        emitter.emit('connect');
      }
    };
    client.onmessage = (event) => {
      AssertionError.assert(typeof event.data === 'string', error_types.ERR_INVALID_PARAMETER_TYPE);
      const message = JSON.parse(event.data);
      emitter.emit('message', message);
    };
    client.onerror = async (event) => {
      emitter.emit('error', event);
    };
    client.onclose = async (event) => {
      emitter.emit('disconnect', event.code, event.reason);
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
  const get_state = () => {
    if (client instanceof WebSocket) {
      return client.readyState;
    }
    return null;
  };
  const websocket_client = {
    send,
    send_arraybuffer,
    connect,
    disconnect,
    get_state,
    on: emitter.on,
    off: emitter.off,
    error_types,
    state_types,
  };
  return websocket_client;
};

module.exports = create_websocket_client;