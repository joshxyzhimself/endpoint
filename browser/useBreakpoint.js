import { useState, useEffect } from 'react';

const get_breakpoint = () => {
  if (window.innerWidth >= 1280) {
    return 'xl';
  }
  if (window.innerWidth >= 1024) {
    return 'lg';
  }
  if (window.innerWidth >= 768) {
    return 'md';
  }
  if (window.innerWidth >= 640) {
    return 'sm';
  }
  return 'xs';
};

const useBreakpoint = () => {
  const [breakpoint, set_breakpoint] = useState(get_breakpoint());
  useEffect(() => {
    const handler = () => {
      const current_breakpoint = get_breakpoint();
      if (breakpoint !== current_breakpoint) {
        set_breakpoint(current_breakpoint);
      }
    };
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('resize', handler);
    };
  }, [breakpoint]);
  return breakpoint;
};

export default useBreakpoint;
