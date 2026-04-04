/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
    ],
  },
}

// next-pwa is disabled for now due to Turbopack incompatibility in Next.js 16
// Re-enable with: const withPWA = require('next-pwa')({...}); module.exports = withPWA(nextConfig)
module.exports = nextConfig
