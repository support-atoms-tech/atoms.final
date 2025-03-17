import { useState, useEffect, useRef } from 'react';

/**
 * A custom hook that throttles real-time updates to prevent excessive re-renders.
 * This is particularly useful for data that changes frequently, like real-time collaboration.
 * 
 * @param value The value to throttle
 * @param interval The minimum time (in ms) between updates
 * @param compareFunc Optional custom comparison function to determine if the value has changed
 * @returns The throttled value
 */
export function useRealTimeUpdates<T>(
  value: T, 
  interval: number = 250,
  compareFunc?: (prev: T, next: T) => boolean
): T {
  // Store the throttled value in state
  const [throttledValue, setThrottledValue] = useState<T>(value);
  
  // Use refs to track the latest value and timing
  const latestValueRef = useRef<T>(value);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  
  // Default comparison function
  const defaultCompare = (prev: T, next: T): boolean => {
    if (Array.isArray(prev) && Array.isArray(next)) {
      // For arrays, compare length first for quick check
      if (prev.length !== next.length) return false;
      
      // Then do a shallow comparison of elements
      return prev.every((item, index) => item === next[index]);
    }
    
    // For objects, do a shallow comparison
    if (typeof prev === 'object' && prev !== null && 
        typeof next === 'object' && next !== null) {
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next as object);
      
      if (prevKeys.length !== nextKeys.length) return false;
      
      return prevKeys.every(key => 
        (prev as any)[key] === (next as any)[key]
      );
    }
    
    // For primitives, use strict equality
    return prev === next;
  };
  
  // Use the provided comparison function or the default one
  const compareValues = compareFunc || defaultCompare;
  
  useEffect(() => {
    // Always update the latest value ref
    latestValueRef.current = value;
    
    // Check if the value has changed
    if (!compareValues(throttledValue, value)) {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
      
      // If enough time has passed since the last update, update immediately
      if (timeSinceLastUpdate >= interval) {
        setThrottledValue(value);
        lastUpdateTimeRef.current = now;
      } 
      // Otherwise, schedule an update for later
      else if (!timeoutIdRef.current) {
        timeoutIdRef.current = setTimeout(() => {
          setThrottledValue(latestValueRef.current);
          lastUpdateTimeRef.current = Date.now();
          timeoutIdRef.current = null;
        }, interval - timeSinceLastUpdate);
      }
    }
    
    // Clean up any pending timeouts on unmount
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
  }, [value, interval, throttledValue, compareValues]);
  
  return throttledValue;
} 