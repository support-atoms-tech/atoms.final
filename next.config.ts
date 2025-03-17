import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    experimental: {
        // Disable React compiler in development as it may interfere with DevTools
        reactCompiler: false,
    },
};

export default nextConfig;
