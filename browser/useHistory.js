
// @ts-check

import { useState, useEffect, useCallback } from 'react';
import assert from '../core/assert';

/**
 * @type {import('./useHistory').useHistory}
 */
const useHistory = () => {

  const [previous_pathname, set_previous_pathname] = useState(null);
  const [pathname, set_pathname] = useState(window.location.pathname);

  /**
   * @type {import('./useHistory').push}
   */
  const push = useCallback((next_pathname) => {
    assert(typeof next_pathname === 'string');
    if (pathname !== next_pathname) {
      window.history.pushState(null, null, next_pathname);
      set_previous_pathname(pathname);
      set_pathname(next_pathname);
    }
  }, [pathname]);

  /**
   * @type {import('./useHistory').push}
   */
  const replace = useCallback((next_pathname) => {
    assert(typeof next_pathname === 'string');
    if (pathname !== next_pathname) {
      window.history.replaceState(null, null, next_pathname);
      set_previous_pathname(pathname);
      set_pathname(next_pathname);
    }
  }, [pathname]);

  useEffect(() => {
    const popstate_listener = () => {
      set_previous_pathname(pathname);
      set_pathname(window.location.pathname);
    };
    window.addEventListener('popstate', popstate_listener);
    return () => {
      window.removeEventListener('popstate', popstate_listener);
    };
  }, []);

  /**
   * @type {import('./useHistory').history}
   */
  const history = {
    previous_pathname,
    pathname,
    push,
    replace,
  };

  return history;
};

export default useHistory;
