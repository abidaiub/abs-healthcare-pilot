import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: { root: process.cwd() },
  experimental: { serverActions: { bodySizeLimit: "1mb" } },
};

export default nextConfig;
