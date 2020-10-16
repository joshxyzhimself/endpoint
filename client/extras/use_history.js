
import React from 'react';

function useHistory() {
  const [pathname, set_pathname] = React.useState(window.location.pathname);
  const popstate_listener = () => {
    set_pathname(window.location.pathname);
  };
  const history = {
    pathname,
    push: (next_pathname) => {
      if (pathname !== next_pathname) {
        window.history.pushState(null, null, next_pathname);
        set_pathname(next_pathname);
      }
    },
    replace: (next_pathname) => {
      if (pathname !== next_pathname) {
        window.history.replaceState(null, null, next_pathname);
        set_pathname(next_pathname);
      }
    },
  };
  React.useEffect(() => {
    window.addEventListener('popstate', popstate_listener);
    return () => {
      window.removeEventListener('popstate', popstate_listener);
    };
  }, []);
  return history;
}

export default useHistory;
