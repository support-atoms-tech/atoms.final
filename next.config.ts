import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    experimental: {
        // Enable React compiler for improved performance
        reactCompiler: true,
    },
    images: {
        domains: ['lh3.googleusercontent.com'],
    },
    eslint: {
        // Temporarily ignore ESLint errors during builds
        ignoreDuringBuilds: true,
    },
    webpack: (config, { isServer }) => {
        // Handle xlsx dynamic import properly
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                path: false,
                crypto: false,
            };
        }
        return config;
    },
};

export default nextConfig;
