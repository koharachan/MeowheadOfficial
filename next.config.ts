import { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "export",
  images: {
    unoptimized: true,
    domains: [],
  },
  reactStrictMode: true,
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: /(?:^|[\\/])(?:node_modules|\.git)(?:[\\/]|$)|(?:^|[\\/])(?:pagefile\.sys|swapfile\.sys|DumpStack\.log\.tmp)$/i,
    };
    return config;
  },
};

export default nextConfig;
