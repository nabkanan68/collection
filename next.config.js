/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Optimize performance
  poweredByHeader: false,
  // Optimize image performance
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  // Optimize package imports
  experimental: {
    optimizePackageImports: ['react', '@tremor/react', 'react-icons'],
    // Enable React Server Components optimization
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
