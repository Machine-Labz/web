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
};

export default nextConfig;
