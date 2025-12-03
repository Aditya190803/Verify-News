import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * Custom hook for debouncing a value
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns The debounced value
 * 
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 * 
 * useEffect(() => {
 *   if (debouncedSearchTerm) {
 *     performSearch(debouncedSearchTerm);
 *   }
 * }, [debouncedSearchTerm]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for debouncing a callback function
 * The callback will only be executed after the specified delay has passed
 * since the last call
 * 
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns A debounced version of the callback
 * 
 * @example
 * ```tsx
 * const debouncedSearch = useDebouncedCallback(
 *   (query: string) => {
 *     performSearch(query);
 *   },
 *   500
 * );
 * 
 * <input onChange={(e) => debouncedSearch(e.target.value)} />
 * ```
 */
export function useDebouncedCallback<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );

  return debouncedCallback;
}

/**
 * Custom hook for debouncing with immediate execution option
 * The callback will execute immediately on the first call, then debounce subsequent calls
 * 
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @param leading - Execute on leading edge (default: true)
 * @param trailing - Execute on trailing edge (default: true)
 * @returns Object with debounced function and cancel method
 * 
 * @example
 * ```tsx
 * const { debouncedFn, cancel } = useDebouncedCallbackAdvanced(
 *   (query: string) => performSearch(query),
 *   500,
 *   true,  // execute immediately
 *   true   // also execute after delay
 * );
 * ```
 */
export function useDebouncedCallbackAdvanced<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  delay: number = 300,
  leading: boolean = false,
  trailing: boolean = true
): { debouncedFn: (...args: Parameters<T>) => void; cancel: () => void; flush: () => void } {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);
  const lastArgsRef = useRef<Parameters<T> | null>(null);
  const lastCallTimeRef = useRef<number | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    lastArgsRef.current = null;
    lastCallTimeRef.current = null;
  }, []);

  const flush = useCallback(() => {
    if (timeoutRef.current && lastArgsRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      callbackRef.current(...lastArgsRef.current);
      lastArgsRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cancel;
  }, [cancel]);

  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const isFirstCall = lastCallTimeRef.current === null;
      
      lastArgsRef.current = args;
      lastCallTimeRef.current = now;

      // Execute on leading edge
      if (leading && isFirstCall) {
        callbackRef.current(...args);
      }

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout for trailing edge
      if (trailing) {
        timeoutRef.current = setTimeout(() => {
          // Don't execute if leading already executed and no subsequent calls
          if (!leading || !isFirstCall) {
            if (lastArgsRef.current) {
              callbackRef.current(...lastArgsRef.current);
            }
          }
          lastArgsRef.current = null;
          lastCallTimeRef.current = null;
        }, delay);
      }
    },
    [delay, leading, trailing]
  );

  return useMemo(
    () => ({ debouncedFn, cancel, flush }),
    [debouncedFn, cancel, flush]
  );
}

/**
 * Custom hook for throttling a callback function
 * The callback will be executed at most once per delay period
 * 
 * @param callback - The function to throttle
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns A throttled version of the callback
 * 
 * @example
 * ```tsx
 * const throttledScroll = useThrottledCallback(
 *   (event: ScrollEvent) => {
 *     handleScroll(event);
 *   },
 *   100
 * );
 * 
 * window.addEventListener('scroll', throttledScroll);
 * ```
 */
export function useThrottledCallback<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const lastExecutedRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);
  const lastArgsRef = useRef<Parameters<T> | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastExecution = now - lastExecutedRef.current;

      lastArgsRef.current = args;

      if (timeSinceLastExecution >= delay) {
        lastExecutedRef.current = now;
        callbackRef.current(...args);
      } else {
        // Schedule execution for the remaining time
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          lastExecutedRef.current = Date.now();
          if (lastArgsRef.current) {
            callbackRef.current(...lastArgsRef.current);
          }
        }, delay - timeSinceLastExecution);
      }
    },
    [delay]
  );

  return throttledCallback;
}
