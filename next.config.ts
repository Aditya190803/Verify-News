import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  transpilePackages: ['convex'],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-router-dom': path.resolve(__dirname, 'src/lib/next-router-compat.tsx'),
    };
    return config;
  },
  turbopack: {
    resolveAlias: {
      'react-router-dom': './src/lib/next-router-compat.tsx',
    },
  },
};

export default nextConfig;