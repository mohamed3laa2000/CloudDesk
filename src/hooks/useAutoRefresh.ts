import { useEffect, useRef } from 'react';

interface UseAutoRefreshOptions {
  interval?: number; // in milliseconds
  enabled?: boolean;
}

/**
 * Hook for auto-refreshing data at regular intervals
 */
export function useAutoRefresh(
  callback: () => void,
  { interval = 5000, enabled = true }: UseAutoRefreshOptions = {}
) {
  const savedCallback = useRef(callback);

  // Update ref when callback changes
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up interval
  useEffect(() => {
    if (!enabled) return;

    const tick = () => savedCallback.current();
    const id = setInterval(tick, interval);

    return () => clearInterval(id);
  }, [interval, enabled]);
}
