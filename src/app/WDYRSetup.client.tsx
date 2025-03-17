'use client';

import { useEffect } from 'react';

export function WDYRSetup() {
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            try {
                // Dynamically import React and WDYR
                const React = require('react');
                const whyDidYouRender = require('@welldone-software/why-did-you-render');
                
                // Basic configuration that avoids problematic features
                whyDidYouRender(React, {
                    // Disable features that cause issues with React 19
                    trackAllPureComponents: false,
                    trackHooks: false,
                    logOnDifferentValues: true,
                    hotReloadBufferMs: 2000,
                    
                    // Exclude problematic components
                    exclude: [
                        // Next.js components
                        /^(AppRouter|Router|LayoutRouter|RenderFromTemplateContext|HotReload)$/,
                        // Provider components
                        /^(CookiesProvider|QueryProvider|ThemeProvider|GlobalErrorBoundary)$/,
                        // Our components
                        /^ProfilerWrapper$/,
                    ],
                    
                    // Simple logging
                    onlyLogs: true,
                });
                
                console.log('WDYR initialized with minimal configuration');
            } catch (error) {
                console.error('Failed to initialize WDYR:', error);
            }
        }
    }, []);

    return null;
} 