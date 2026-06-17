import { useEffect, useRef } from 'react';

export function useRealtimeData(callback: () => void, interval: number = 5000) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const tick = () => savedCallback.current();
    tick();
    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [interval]);
}
