import { useCallback, useEffect, useRef } from 'react';

export interface UsePollingOptions {
  intervalMs: number;
  enabled?: boolean;
  immediate?: boolean;
}

export function usePolling(
  callback: () => Promise<void> | void,
  { intervalMs, enabled = true, immediate = true }: UsePollingOptions
): { trigger: () => Promise<void> } {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const isRunningRef = useRef(false);

  const run = useCallback(async () => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    try {
      await callbackRef.current();
    } finally {
      isRunningRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    if (immediate) {
      void run();
    }

    let timerId: number | undefined;

    const scheduleNext = () => {
      if (timerId !== undefined) {
        window.clearInterval(timerId);
      }
      timerId = window.setInterval(() => {
        if (typeof document === 'undefined' || document.visibilityState === 'visible') {
          void run();
        }
      }, intervalMs);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void run();
      }
    };

    scheduleNext();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timerId !== undefined) {
        window.clearInterval(timerId);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, immediate, intervalMs, run]);

  return { trigger: run };
}
