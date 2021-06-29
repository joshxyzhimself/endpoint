const AssertionError = require('../core/AssertionError');
const create_emitter = require('../core/create_emitter');
const logs = require('../core/logs');
const WebSocket = require('ws');

const error_types = {
  ERR_INVALID_PARAMETER_TYPE: 'ERR_INVALID_PARAMETER_TYPE',
  ERR_WEBSOCKET_DISCONNECTED: 'ERR_WEBSOCKET_DISCONNECTED',
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
const create_websocket_client = (id, url) => {
  AssertionError.assert(typeof id === 'string', error_types.ERR_INVALID_PARAMETER_TYPE);
  AssertionError.assert(typeof url === 'string', error_types.ERR_INVALID_PARAMETER_TYPE);

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
        AssertionError.assert(client.terminate instanceof Function);
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
    AssertionError.assert(data instanceof Object, error_types.ERR_INVALID_PARAMETER_TYPE);
    AssertionError.assert(client instanceof WebSocket, error_types.ERR_WEBSOCKET_DISCONNECTED);
    AssertionError.assert(client.readyState === event_types.CONNECTED, error_types.ERR_WEBSOCKET_DISCONNECTED);
    const data2 = JSON.stringify(data);
    client.send(data2);
  };

  /**
   * @param {ArrayBuffer} data
   */
  const send_arraybuffer = (data) => {
    AssertionError.assert(data instanceof ArrayBuffer, error_types.ERR_INVALID_PARAMETER_TYPE);
    AssertionError.assert(client instanceof WebSocket, error_types.ERR_WEBSOCKET_DISCONNECTED);
    AssertionError.assert(client.readyState === event_types.CONNECTED, error_types.ERR_WEBSOCKET_DISCONNECTED);
    client.send(data);
  };

  const connect = () => {
    logs.emit({
      resource_id: 'node_websocket_client',
      operation_id: 'connect',
      data: { id, state: 'CONNECTING' },
      severity: { type: logs.severity_types.INFO, code: logs.severity_codes.INFO },
      trace: { mts: Date.now() },
    });
    emitter.emit(event_types.CONNECTING);
    emitter.emit(event_types.STATE, event_types.CONNECTING);
    client = new WebSocket(url);
    ping_interval = setInterval(() => {
      if (client instanceof Object) {
        AssertionError.assert(client.ping instanceof Function);
        AssertionError.assert(typeof client.readyState === 'number');
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
      logs.emit({
        resource_id: 'node_websocket_client',
        operation_id: 'on_open',
        data: { id, state: 'CONNECTED' },
        severity: { type: logs.severity_types.INFO, code: logs.severity_codes.INFO },
        trace: { mts: Date.now() },
      });
      if (client.readyState === event_types.CONNECTED) {
        emitter.emit(event_types.CONNECTED);
        emitter.emit(event_types.STATE, event_types.CONNECTED);
      }
    });
    client.on('message', (data) => {
      AssertionError.assert(typeof data === 'string', error_types.ERR_INVALID_PARAMETER_TYPE);
      const message = JSON.parse(data);
      emitter.emit(event_types.MESSAGE, message);
    });
    client.on('error', (error) => {
      logs.emit({
        resource_id: 'node_websocket_client',
        operation_id: 'on_error',
        data: { id, state: 'ERROR' },
        error: logs.capture_error(error),
        severity: { type: logs.severity_types.ERROR, code: logs.severity_codes.ERROR },
        trace: { mts: Date.now() },
      });
      emitter.emit(event_types.ERROR, error);
    });
    client.on('close', async (code, reason) => {
      logs.emit({
        resource_id: 'node_websocket_client',
        operation_id: 'on_disconnect',
        data: { id, code, reason, state: 'DISCONNECTED' },
        severity: { type: logs.severity_types.INFO, code: logs.severity_codes.INFO },
        trace: { mts: Date.now() },
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
        logs.emit({
          resource_id: 'node_websocket_client',
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
    error_types,
  };

  return websocket_client;
};

module.exports = create_websocket_client;