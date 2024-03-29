
// @ts-check

const WebSocket = require('ws');
const assert = require('../core/assert');
const severity = require('../core/severity');
const create_emitter = require('../core/create_emitter');


const errors = {
  INVALID_API: {
    code: 'ERR_WEBSOCKET_INVALID_API',
    message: 'Invalid api.',
  },
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


const events = create_emitter();


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
  assert(typeof id === 'string', errors.INVALID_ID.code, errors.INVALID_ID.message);
  assert(typeof url === 'string', errors.INVALID_URL.code, errors.INVALID_URL.message);

  let client = null;
  let ping_interval = null;
  let ping_timestamp_ms = null;
  let ping_latency = null;
  let ping_heartbeat_timeout = null;
  let backoff = 125;

  const emitter = create_emitter();

  const ping_heartbeat = () => {
    if (ping_heartbeat_timeout !== null) {
      clearTimeout(ping_heartbeat_timeout);
    }
    ping_heartbeat_timeout = setTimeout(() => {
      if (client instanceof Object) {
        assert(client.terminate instanceof Function, errors.INVALID_API.code, errors.INVALID_API.message);
        client.terminate();
      }
      ping_heartbeat_timeout = null;
    }, 30000);
  };

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
    assert(data instanceof Object, errors.INVALID_DATA.code, errors.INVALID_DATA.message);
    assert(client instanceof WebSocket, errors.SOCKET_DISCONNECTED.code, errors.SOCKET_DISCONNECTED.message);
    assert(client.readyState === event_types.CONNECTED, errors.SOCKET_DISCONNECTED.code, errors.SOCKET_DISCONNECTED.message);
    const data2 = JSON.stringify(data);
    client.send(data2);
  };

  /**
   * @param {ArrayBuffer} data
   */
  const send_arraybuffer = (data) => {
    assert(data instanceof ArrayBuffer, errors.INVALID_DATA.code, errors.INVALID_DATA.message);
    assert(client instanceof WebSocket, errors.SOCKET_DISCONNECTED.code, errors.SOCKET_DISCONNECTED.message);
    assert(client.readyState === event_types.CONNECTED, errors.SOCKET_DISCONNECTED.code, errors.SOCKET_DISCONNECTED.message);
    client.send(data);
  };

  const connect = () => {
    events.emit(severity.types.INFO, {
      resource_id: 'node_websocket_client',
      operation_id: 'connect',
      data: { id, state: 'CONNECTING' },
      timestamp: Date.now(),
    });
    emitter.emit(event_types.CONNECTING);
    emitter.emit(event_types.STATE, event_types.CONNECTING);
    client = new WebSocket(url);
    ping_interval = setInterval(() => {
      if (client instanceof Object) {
        assert(client.ping instanceof Function, errors.INVALID_API.code, errors.INVALID_API.message);
        assert(typeof client.readyState === 'number', errors.INVALID_API.code, errors.INVALID_API.message);
        if (client.readyState === event_types.CONNECTED) {
          client.ping(() => {
            ping_timestamp_ms = Date.now();
          });
        }
      }
    }, 1000);

    client.on('pong', () => {
      ping_latency = Date.now() - ping_timestamp_ms;
      ping_heartbeat();
    });

    client.on('open', () => {
      events.emit(severity.types.INFO, {
        resource_id: 'node_websocket_client',
        operation_id: 'on_open',
        data: { id, state: 'CONNECTED' },
        timestamp: Date.now(),
      });
      if (client.readyState === event_types.CONNECTED) {
        emitter.emit(event_types.CONNECTED);
        emitter.emit(event_types.STATE, event_types.CONNECTED);
      }
    });
    client.on('message', (data) => {
      assert(typeof data === 'string', errors.INVALID_DATA.code, errors.INVALID_DATA.message);
      const message = JSON.parse(String(data));
      emitter.emit(event_types.MESSAGE, message);
    });
    client.on('error', (error) => {
      events.emit(severity.types.ERROR, {
        resource_id: 'node_websocket_client',
        operation_id: 'on_error',
        data: { id, state: 'ERROR' },
        timestamp: Date.now(),
        error: severity.extract_error(error),
      });
      emitter.emit(event_types.ERROR, error);
    });
    client.on('close', async (code, reason) => {
      events.emit(severity.types.INFO, {
        resource_id: 'node_websocket_client',
        operation_id: 'on_disconnect',
        data: { id, code, reason, state: 'DISCONNECTED' },
        timestamp: Date.now(),
      });
      emitter.emit(event_types.DISCONNECTED, code, reason);
      emitter.emit(event_types.STATE, event_types.DISCONNECTED, code, reason);
      clearInterval(ping_interval);
      clearTimeout(ping_heartbeat_timeout);
      client = null;
      ping_interval = null;
      ping_timestamp_ms = null;
      ping_latency = null;
      if (code === 1000) {
        return;
      }
      await await_backoff();
      connect();
    });
  };

  const disconnect = () => {
    if (client instanceof WebSocket) {
      if (client.readyState === event_types.CONNECTED) {
        events.emit(severity.types.INFO, {
          resource_id: 'node_websocket_client',
          operation_id: 'disconnect',
          data: { id, state: 'DISCONNECTING' },
          timestamp: Date.now(),
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

  const get_latency = () => {
    return ping_latency;
  };

  const websocket_client = {
    send,
    send_arraybuffer,
    connect,
    disconnect,
    get_state,
    get_latency,
    on: emitter.on,
    off: emitter.off,
    event_types,
    errors,
    events,
  };

  return websocket_client;
};

module.exports = create_ws_client;