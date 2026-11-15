/** @type {import('next').NextConfig} */
const nextConfig = {
  // The sdk ships raw TypeScript (no build step), so Next must transpile it.
  transpilePackages: ['@coinpack/sdk'],
  eslint: { ignoreDuringBuilds: true },
  webpack: (config) => {
    // wagmi / WalletConnect pull in optional node-only deps; silence them in the browser bundle.
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

module.exports = nextConfig;
