
// @ts-check

const AssertionError = require('../core/AssertionError');
const create_emitter = require('../core/create_emitter');
const logs = require('../core/logs');

const errors = {
  INVALID_ID: {
    code: 'ERR_WEBSOCKET_INVALID_ID',
    message: 'Invalid id.',
  },
  INVALID_URL: {
    code: 'ERR_WEBSOCKET_INVALID_URL',
    message: 'Invalid url.',
  },
  INVALID_DATA: {
    code: 'ERR_WEBSOCKET_INVALID_DATA',
    message: 'Invalid data.',
  },
  SOCKET_DISCONNECTED: {
    code: 'ERR_WEBSOCKET_DISCONNECTED',
    message: 'Websocket disconnected.',
  },
};

const event_types = {
  CONNECTING: 0,

  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,

  CONNECTED: 1,
  DISCONNECTING: 2,
  DISCONNECTED: 3,

  MESSAGE: 4,
  ERROR: 5,
  STATE: 6,
};

/**
 * @param {string} id
 * @param {string} url
 */
const create_ws_client = (id, url) => {
  AssertionError.assert(typeof id === 'string', errors.INVALID_ID.code, errors.INVALID_ID.message);
  AssertionError.assert(typeof url === 'string', errors.INVALID_URL.code, errors.INVALID_URL.message);

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
    AssertionError.assert(data instanceof Object, errors.INVALID_DATA.code, errors.INVALID_DATA.message);
    AssertionError.assert(client instanceof WebSocket, errors.SOCKET_DISCONNECTED.code, errors.SOCKET_DISCONNECTED.message);
    AssertionError.assert(client.readyState === 1, errors.SOCKET_DISCONNECTED.code, errors.SOCKET_DISCONNECTED.message);
    const data2 = JSON.stringify(data);
    client.send(data2);
  };

  /**
   * @param {ArrayBuffer} data
   */
  const send_arraybuffer = (data) => {
    AssertionError.assert(data instanceof ArrayBuffer, errors.INVALID_DATA.code, errors.INVALID_DATA.message);
    AssertionError.assert(client instanceof WebSocket, errors.SOCKET_DISCONNECTED.code, errors.SOCKET_DISCONNECTED.message);
    AssertionError.assert(client.readyState === 1, errors.SOCKET_DISCONNECTED.code, errors.SOCKET_DISCONNECTED.message);
    client.send(data);
  };

  const connect = () => {
    logs.emit({
      resource_id: 'browser_websocket_client',
      operation_id: 'connect',
      data: { id, state: 'CONNECTING' },
      severity: { type: logs.severity_types.INFO, code: logs.severity_codes.INFO },
      trace: { mts: Date.now() },
    });
    emitter.emit(event_types.CONNECTING);
    emitter.emit(event_types.STATE, event_types.CONNECTING);
    client = new WebSocket(url);
    client.onopen = () => {
      logs.emit({
        resource_id: 'browser_websocket_client',
        operation_id: 'on_connect',
        data: { id, state: 'CONNECTED' },
        severity: { type: logs.severity_types.INFO, code: logs.severity_codes.INFO },
        trace: { mts: Date.now() },
      });
      if (client.readyState === 1) {
        emitter.emit(event_types.CONNECTED);
        emitter.emit(event_types.STATE, event_types.CONNECTED);
      }
    };
    client.onmessage = (event) => {
      AssertionError.assert(typeof event.data === 'string', errors.INVALID_DATA.code, errors.INVALID_DATA.message);
      const message = JSON.parse(event.data);
      emitter.emit(event_types.MESSAGE, message);
    };
    client.onerror = async () => {
      logs.emit({
        resource_id: 'browser_websocket_client',
        operation_id: 'on_error',
        data: { id, state: 'ERROR' },
        severity: { type: logs.severity_types.ERROR, code: logs.severity_codes.ERROR },
        trace: { mts: Date.now() },
      });
      emitter.emit(event_types.ERROR);
    };
    client.onclose = async (event) => {
      const code = event.code;
      const reason = event.reason;
      logs.emit({
        resource_id: 'browser_websocket_client',
        operation_id: 'on_disconnect',
        data: { id, code, reason, state: 'DISCONNECTED' },
        severity: { type: logs.severity_types.INFO, code: logs.severity_codes.INFO },
        trace: { mts: Date.now() },
      });
      emitter.emit(event_types.DISCONNECTED, code, reason);
      emitter.emit(event_types.STATE, event_types.DISCONNECTED, code, reason);
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
        logs.emit({
          resource_id: 'browser_websocket_client',
          operation_id: 'disconnect',
          data: { id, state: 'DISCONNECTING' },
          severity: { type: logs.severity_types.INFO, code: logs.severity_codes.INFO },
          trace: { mts: Date.now() },
        });
        emitter.emit(event_types.DISCONNECTING);
        emitter.emit(event_types.STATE, event_types.DISCONNECTING);
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
    event_types,
    errors,
  };

  return websocket_client;
};

module.exports = create_ws_client;