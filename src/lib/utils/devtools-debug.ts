/**
 * Debug utilities for React DevTools and WDYR
 * This file helps diagnose issues with development tools setup
 */

/**
 * Checks React DevTools environment and logs debug information
 */
export function debugReactDevTools(): void {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    console.log('Debug only runs in browser during development');
    return;
  }

  // Check for React DevTools global hook
  console.group('React DevTools Debug Info');
  const hasDevToolsHook = !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  console.log('DevTools Hook Present:', hasDevToolsHook);
  
  if (hasDevToolsHook && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    console.log('supportsFiber:', hook.supportsFiber);
    console.log('isDisabled:', hook.isDisabled);
    console.log('Extension ID:', hook.rendererInterfaces ? 'Connected' : 'Not connected');
  }
  console.groupEnd();
  
  // Check React version
  try {
    const React = require('react');
    const ReactDOM = require('react-dom');
    console.group('React Version Info');
    console.log('React version:', React.version);
    console.log('ReactDOM version:', ReactDOM.version);
    console.groupEnd();
  } catch (e) {
    console.error('Failed to get React version:', e);
  }
  
  // Check if WDYR is properly set up
  console.group('WDYR Setup');
  try {
    const whyDidYouRender = require('@welldone-software/why-did-you-render');
    console.log('WDYR package available');
    
    // Check if React has been patched by WDYR
    const React = require('react');
    const hasWdyrPatch = !!(React.Component && React.Component.whyDidYouRender);
    console.log('React patched by WDYR:', hasWdyrPatch);
  } catch (e) {
    console.log('WDYR not properly initialized:', e);
  }
  console.groupEnd();
}

// Add this to the window object for easy console access
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).debugReactDevTools = debugReactDevTools;
  console.log('Debug function available via window.debugReactDevTools()');
} 