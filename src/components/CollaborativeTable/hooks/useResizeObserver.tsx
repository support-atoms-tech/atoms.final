// hooks/useResizeObserver.ts
import { useEffect, useRef, useState } from 'react';

/**
 * Hook for monitoring size changes of DOM elements
 * 
 * @param elementRef - React ref object for the element to observe
 * @param callback - Function to call when size changes are detected
 * @param options - Optional ResizeObserver options
 * 
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 * 
 * useResizeObserver(containerRef, (entry) => {
 *   const { width, height } = entry.contentRect;
 *   console.log(`New size: ${width}px × ${height}px`);
 * });
 * ```
 */
export function useResizeObserver<T extends HTMLElement = HTMLElement>(
  elementRef: React.RefObject<T>,
  callback: (entry: ResizeObserverEntry) => void,
  options?: ResizeObserverOptions
): void {
  // Keep the callback in a ref to avoid recreating the observer on callback changes
  const callbackRef = useRef(callback);

  // Update the callback ref when the callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // Skip if element ref is null or if ResizeObserver is not supported
    if (!elementRef.current || typeof ResizeObserver === 'undefined') {
      return;
    }

    // Track the current element for cleanup
    const currentElement = elementRef.current;

    // Create a ResizeObserver instance
    const observer = new ResizeObserver((entries) => {
      // In most cases, there will only be one entry
      if (entries.length > 0) {
        // Call the latest callback with the entry
        callbackRef.current(entries[0]);
      }
    });

    // Start observing the element
    observer.observe(currentElement, options);

    // Clean up by disconnecting the observer when the component unmounts
    // or if the ref changes
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [elementRef, options]);
}

/**
 * Hook for monitoring multiple elements with the same callback
 * 
 * @param elementRefs - Array of React ref objects for elements to observe
 * @param callback - Function to call when size changes are detected
 * @param options - Optional ResizeObserver options
 */
export function useMultiResizeObserver<T extends HTMLElement = HTMLElement>(
  elementRefs: React.RefObject<T>[],
  callback: (entries: ResizeObserverEntry[]) => void,
  options?: ResizeObserverOptions
): void {
  // Keep the callback in a ref to avoid recreating the observer on callback changes
  const callbackRef = useRef(callback);

  // Update the callback ref when the callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // Skip if no refs are provided
    if (elementRefs.length === 0) {
      return;
    }

    // Create a ResizeObserver instance
    const observer = new ResizeObserver((entries) => {
      callbackRef.current(entries);
    });

    // Start observing all valid elements
    const elements: HTMLElement[] = [];
    elementRefs.forEach((ref) => {
      if (ref.current) {
        observer.observe(ref.current, options);
        elements.push(ref.current);
      }
    });

    // Clean up
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [elementRefs, options]);
}

/**
 * Hook that returns the current size of an element
 * 
 * @param elementRef - React ref object for the element to observe
 * @returns - The current size of the element as { width, height }
 * 
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 * const { width, height } = useElementSize(containerRef);
 * ```
 */
export function useElementSize<T extends HTMLElement = HTMLElement>(
  elementRef: React.RefObject<T>
): { width: number; height: number } {
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  useResizeObserver(elementRef, (entry) => {
    const { width, height } = entry.contentRect;
    setSize({ width, height });
  });

  // Initialize size on mount if element already exists
  useEffect(() => {
    if (elementRef.current) {
      const { offsetWidth, offsetHeight } = elementRef.current;
      setSize({ width: offsetWidth, height: offsetHeight });
    }
  }, [elementRef]);

  return size;
}