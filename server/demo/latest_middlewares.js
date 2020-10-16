
const { HTTPError } = require('endpoint/server');

const sid_session_map = new Map();
const sid_ip_map = new Map(); // ip address pinning
const sid_ua_map = new Map(); // user-agent pinning

const lock_ip_address = false;
const lock_user_agent = false;

const middlewares = {
  cookie_sessions: (request) => {
    if (
      sid_session_map.has(request.sid) === false
      || (lock_ip_address === true && sid_ip_map.get(request.sid) !== request.ip)
      || (lock_user_agent === true && sid_ua_map.get(request.sid) !== request.ua)
    ) {
      sid_session_map.set(request.sid, { user: null });
      if (lock_ip_address === true) {
        sid_ip_map.set(request.sid, request.ip);
      }
      if (lock_user_agent === true) {
        sid_ua_map.set(request.sid, request.ua);
      }
    }
    request.session = sid_session_map.get(request.sid);
  },
  guests_only: (request) => {
    if (typeof request.session === 'object') {
      if (request.session.user === null) {
        return undefined;
      }
    }
    throw new HTTPError(403);
  },
  users_only: (request) => {
    if (typeof request.session === 'object') {
      if (request.session.user !== null) {
        if (typeof request.session.user === 'object') {
          return undefined;
        }
      }
    }
    throw new HTTPError(403);
  },
};

module.exports = middlewares;
