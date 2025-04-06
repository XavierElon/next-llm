import type { NextConfig } from 'next'
const { withNextDevtools } = require('@next-devtools/core/plugin')

const config: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    remotePatterns: []
  },
  experimental: {
    // This will allow Next.js to handle hydration mismatches more gracefully
    optimizePackageImports: ['@next-devtools/core']
  }
}

// Wrap the config with withNextDevtools
export default withNextDevtools(config)
