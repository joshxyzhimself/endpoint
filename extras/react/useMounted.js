import { useRef, useEffect } from 'react';

function useMounted () {
  const mounted = useRef();
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  return mounted;
}

export default useMounted;