const assert = require('assert');
const { HTTPError } = require('../index');

// TODO: async version for redis-based sessions
// TODO: interval-based stale session clean-up

const middlewares = {
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
