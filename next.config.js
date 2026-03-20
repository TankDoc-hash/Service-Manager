/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel deployment optimizations
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
}

module.exports = nextConfig
