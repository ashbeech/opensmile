import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable TypeScript errors blocking build for development
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
