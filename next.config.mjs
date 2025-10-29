/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Handle WebAssembly modules
    config.experiments = {
      ...config.experiments,
      syncWebAssembly: true,
      asyncWebAssembly: true,
    };

    return config;
  },
  async headers() {
    return [];
  },
  // Ensure .well-known routes are properly served
  async rewrites() {
    return [
      {
        source: '/.well-known/assetlinks.json',
        destination: '/.well-known/assetlinks.json',
      },
    ];
  },
};

export default nextConfig;
