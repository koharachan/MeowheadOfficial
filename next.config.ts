import { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "export",
  images: {
    unoptimized: true,
    domains: [],
  },
  reactStrictMode: true,
};

export default nextConfig;
