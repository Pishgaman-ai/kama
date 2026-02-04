/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Increase timeout for API routes (in milliseconds)
    proxyTimeout: 180000, // 3 minutes
  },
  serverComponentsExternalPackages: ['exceljs'],
};

module.exports = nextConfig;
