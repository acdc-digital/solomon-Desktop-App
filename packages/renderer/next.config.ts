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
      // Externalize modules that are Node-only
      const externalsConfig = {
        'onnxruntime-node': 'commonjs onnxruntime-node',
        'spawn-sync': 'commonjs spawn-sync',
        '@img/sharp-libvips-dev/include': 'commonjs @img/sharp-libvips-dev/include',
        '@img/sharp-libvips-dev/cplusplus': 'commonjs @img/sharp-libvips-dev/cplusplus',
        '@img/sharp-wasm32/versions': 'commonjs @img/sharp-wasm32/versions',
      };
      if (Array.isArray(config.externals)) {
        config.externals.push(externalsConfig);
      } else {
        config.externals = {
          ...config.externals,
          ...externalsConfig,
        };
      }

      // Suppress sharp's dynamic require warning by disabling requireContextCritical
      config.module.rules.push({
        test: /sharp[\\/]lib/,
        parser: {
          requireContextCritical: false,
        },
      });
    }

    // Ignore the critical dependency warning from sharp
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        // Match the file and message pattern from the warning
        module: /sharp[\\/]lib[\\/]sharp\.js/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ];

    return config;
  },
};

module.exports = nextConfig;