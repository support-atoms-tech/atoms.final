// hooks/utils/useErrorBoundary.ts
import { useState, useCallback } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export function useErrorBoundary(): [
  ErrorBoundaryState,
  (error: Error) => void,
  () => void
] {
  const [state, setState] = useState<ErrorBoundaryState>({
    hasError: false,
    error: null
  });
  
  const setError = useCallback((error: Error) => {
    setState({
      hasError: true,
      error
    });
  }, []);
  
  const resetError = useCallback(() => {
    setState({
      hasError: false,
      error: null
    });
  }, []);
  
  return [state, setError, resetError];
}