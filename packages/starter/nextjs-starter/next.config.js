/** @type {import('next').NextConfig} */
const withTM = require('next-transpile-modules')(['@project-serum/sol-wallet-adapter']);

const nextConfig  = {
    reactStrictMode: true,
    webpack: (config, { isServer }) => {
        if (!isServer) {
          config.resolve.fallback.fs = false;
        }
        return config;
    },
};

module.exports = withTM(nextConfig);