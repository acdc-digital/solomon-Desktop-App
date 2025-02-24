// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  assetPrefix: './',
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      if (Array.isArray(config.externals)) {
        config.externals.push({
          'onnxruntime-node': 'commonjs onnxruntime-node',
        });
      } else {
        config.externals = {
          ...config.externals,
          'onnxruntime-node': 'commonjs onnxruntime-node',
        };
      }
    }
    return config;
  },
};

module.exports = nextConfig;