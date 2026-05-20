import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useTimer — custom hook for a stopwatch-style timer.
 * Returns { seconds, isRunning, start, pause, resume, stop, reset }
 */
export default function useTimer(initialSeconds = 0) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const accumulatedRef = useRef(initialSeconds);

  // Use high-precision timing to avoid drift
  const tick = useCallback(() => {
    if (startTimeRef.current) {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setSeconds(accumulatedRef.current + elapsed);
    }
  }, []);

  const start = useCallback(() => {
    if (intervalRef.current) return; // already running
    startTimeRef.current = Date.now();
    setIsRunning(true);
    intervalRef.current = setInterval(tick, 1000);
  }, [tick]);

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // Save accumulated time
    if (startTimeRef.current) {
      accumulatedRef.current += Math.floor((Date.now() - startTimeRef.current) / 1000);
      startTimeRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const resume = useCallback(() => {
    start();
  }, [start]);

  const stop = useCallback(() => {
    pause();
    const total = accumulatedRef.current;
    return total;
  }, [pause]);

  const reset = useCallback((newSeconds = 0) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    startTimeRef.current = null;
    accumulatedRef.current = newSeconds;
    setSeconds(newSeconds);
    setIsRunning(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return { seconds, isRunning, start, pause, resume, stop, reset };
}
