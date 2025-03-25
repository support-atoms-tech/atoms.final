import { useCallback, useRef } from 'react';

/**
 * A hook that returns a debounced version of the callback function.
 * The returned function will only execute after the specified delay
 * has passed without the function being called again.
 * 
 * @param callback The function to debounce
 * @param delay The delay in milliseconds
 * @returns A debounced version of the callback function
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  // Use a ref to store the timeout ID so it persists across renders
  // and to store the latest callback without causing the debounced function to change
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);
  
  // Update the callback ref whenever the callback changes
  callbackRef.current = callback;
  
  // Return a memoized version of the debounced function
  return useCallback((...args: Parameters<T>) => {
    // Clear the previous timeout to cancel any pending executions
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set a new timeout
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]);
} 