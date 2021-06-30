
// @ts-check

// updated: 01-13-2021

import { useState, useEffect, useCallback } from 'react';
import AssertionError from '../core/AssertionError';

function useHistory () {

  const [pathname, set_pathname] = useState(window.location.pathname);

  const push = useCallback((next_pathname) => {
    AssertionError.assert(typeof next_pathname === 'string');
    if (pathname !== next_pathname) {
      window.history.pushState(null, null, next_pathname);
      set_pathname(next_pathname);
    }
  }, [pathname]);

  const replace = useCallback((next_pathname) => {
    AssertionError.assert(typeof next_pathname === 'string');
    if (pathname !== next_pathname) {
      window.history.replaceState(null, null, next_pathname);
      set_pathname(next_pathname);
    }
  }, [pathname]);

  useEffect(() => {
    const popstate_listener = () => {
      set_pathname(window.location.pathname);
    };
    window.addEventListener('popstate', popstate_listener);
    return () => {
      window.removeEventListener('popstate', popstate_listener);
    };
  }, []);

  const history = { pathname, push, replace };

  return history;
}

export default useHistory;
