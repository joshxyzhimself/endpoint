import { useRef, useEffect } from 'react';

function use_mounted() {
  const mounted = useRef();
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  return mounted;
}

export default use_mounted;