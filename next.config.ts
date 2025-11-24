import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    // Enable React compiler for improved performance
    reactCompiler: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
        ],
    },
    ...(process.env.SKIP_LINT
        ? {}
        : {
              eslint: {
                  // Temporarily ignore ESLint errors during builds
                  ignoreDuringBuilds: true,
              },
          }),
    // Add empty turbopack config to silence the warning
    turbopack: {},
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
