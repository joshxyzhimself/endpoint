const assert = require('assert');
const { HTTPError } = require('../index');

const sessions = new Map();

// TODO: async version for redis-based sessions
// TODO: interval-based stale session clean-up

const middlewares = {
  config: {
    use_ip_lock: false, // ip address pinning
    use_ua_lock: false, // user-agent pinning
  },
  cookie_sessions: (request) => {
    try {
      assert(request instanceof Object);
      assert(typeof request.ip === 'string');
      assert(typeof request.ua === 'string');
      assert(typeof request.sid === 'string');
      assert(middlewares.config instanceof Object);
      assert(typeof middlewares.config.use_ip_lock === 'boolean');
      assert(typeof middlewares.config.use_ua_lock === 'boolean');

      if (sessions.has(request.sid) === false) {
        const session = {
          ip: request.ip,
          ua: request.ua,
          data: { user: null },
        };
        sessions.set(request.sid, session);
        request.session = session.data;
        return;
      }

      const session = sessions.get(request.sid);

      if (middlewares.config.use_ip_lock === true) {
        if (session.ip !== request.ip) {
          session.data = { user: null };
        }
      }
      if (middlewares.config.use_ua_lock === true) {
        if (session.ua !== request.ua) {
          session.data = { user: null };
        }
      }

      request.session = session.data;
    } catch (e) {
      throw new HTTPError(500, null, e);
    }
  },
  guests_only: (request) => {
    try {
      assert(request instanceof Object);
      assert(request.session instanceof Object);
      assert(request.session.user === null);
    } catch (e) {
      throw new HTTPError(403, null, e);
    }
  },
  users_only: (request) => {
    try {
      assert(request instanceof Object);
      assert(request.session instanceof Object);
      assert(request.session.user instanceof Object);
    } catch (e) {
      throw new HTTPError(403, null, e);
    }
  },
  admins_only: (request) => {
    try {
      assert(request instanceof Object);
      assert(request.session instanceof Object);
      assert(request.session.user instanceof Object);
      assert(request.session.user.role_ids instanceof Array);
      assert(request.session.user.role_ids.includes(1) === true);
    } catch (e) {
      throw new HTTPError(403, null, e);
    }
  },
};

module.exports = middlewares;
